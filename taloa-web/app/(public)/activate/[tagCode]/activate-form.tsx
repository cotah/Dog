"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";

import { activateTag, uploadPetPhoto } from "@/lib/api/activate";
import { SPECIES_OPTIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/Spinner";

const inputClass =
  "w-full rounded-input border border-slate-300 px-3 py-3 outline-none focus:border-taloa-primary";

export function ActivateForm({ tagCode }: { tagCode: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Validacao em tempo real (mostra feedback conforme o usuario interage)
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // Step 1 — owner
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 — pet
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const step1Valid = Boolean(name && emailValid && phone && passwordValid);

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !email || !phone || password.length < 8) {
      setError("Please fill all fields. Password needs at least 8 characters.");
      return;
    }
    setStep(2);
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onActivate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!petName) {
      setError("Please enter your pet's name.");
      return;
    }
    if (!gdpr) {
      setError("Please accept the privacy terms (GDPR) to continue.");
      return;
    }
    setLoading(true);

    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadPetPhoto(photoFile);
      }

      await activateTag(tagCode, {
        owner: {
          name,
          email,
          phone,
          password,
          emergency_phone: emergencyPhone || undefined,
          gdpr_consent: gdpr,
        },
        pet: { name: petName, species, photo_url: photoUrl },
      });

      // Cria a sessao (best-effort) e leva ao perfil publico recem-ativado
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });

      // Navegacao "dura": garante render fresco do perfil ja ativo
      // (evita o flash do estado antigo vindo do client router cache)
      window.location.assign(`/t/${tagCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col p-4">
      <div className="mb-4 mt-2">
        <h1 className="text-2xl font-bold text-taloa-primary">Activate your tag</h1>
        <p className="text-sm text-slate-500">
          {tagCode} · Step {step} of 2
        </p>
        <div className="mt-3 flex gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-taloa-primary" />
          <div
            className={`h-1.5 flex-1 rounded-full ${
              step === 2 ? "bg-taloa-primary" : "bg-slate-200"
            }`}
          />
        </div>
      </div>

      <div className="rounded-card bg-white p-6 shadow-sm">
        {step === 1 ? (
          <form onSubmit={goToStep2} className="flex flex-col gap-4">
            <h2 className="font-semibold text-slate-700">Your details</h2>
            <input
              className={inputClass}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div>
              <input
                className={`${inputClass} ${touched.email && !emailValid ? "border-taloa-alert" : ""}`}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                required
              />
              {touched.email && !emailValid && (
                <p className="mt-1 text-xs text-taloa-alert">
                  Enter a valid email address.
                </p>
              )}
            </div>
            <input
              className={inputClass}
              type="tel"
              placeholder="Phone (shown to whoever finds your pet)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <div>
              <input
                className={`${inputClass} ${touched.password && !passwordValid ? "border-taloa-alert" : ""}`}
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                minLength={8}
                required
              />
              {password.length > 0 && (
                <p
                  className={`mt-1 text-xs ${passwordValid ? "text-taloa-secondary" : "text-slate-400"}`}
                >
                  {passwordValid ? "✓ Looks good" : `${password.length}/8 characters`}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-taloa-alert">{error}</p>}

            <button
              type="submit"
              disabled={!step1Valid}
              className="h-12 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
            >
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={onActivate} className="flex flex-col gap-4">
            <h2 className="font-semibold text-slate-700">Your pet</h2>

            {/* Foto */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-32 items-center justify-center overflow-hidden rounded-input border-2 border-dashed border-slate-300 bg-taloa-bg text-slate-400 hover:border-taloa-primary"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Pet preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm">
                  <ImagePlus className="h-6 w-6" />
                  Add a photo
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPickPhoto}
              className="hidden"
            />

            <input
              className={inputClass}
              placeholder="Pet's name"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              required
            />

            <select
              className={inputClass}
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            >
              {SPECIES_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <input
              className={inputClass}
              type="tel"
              placeholder="Emergency contact (optional)"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={gdpr}
                onChange={(e) => setGdpr(e.target.checked)}
                className="mt-1"
              />
              <span>I agree to the processing of my data (GDPR).</span>
            </label>

            {error && <p className="text-sm text-taloa-alert">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="h-12 flex-1 rounded-input border border-slate-300 font-medium text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Spinner /> Activating…
                  </>
                ) : (
                  "Activate tag"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
