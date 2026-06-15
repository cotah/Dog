"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { uploadPetPhoto } from "@/lib/api/activate";
import { updatePet } from "@/lib/api/owner";
import { SPECIES_OPTIONS } from "@/lib/constants";
import type { PetSummary, PetUpdatePayload } from "@/types/owner";

const inputClass =
  "w-full rounded-input border border-slate-300 px-3 py-2.5 outline-none focus:border-taloa-primary";
const labelClass = "mb-1 block text-sm font-medium text-slate-600";

export function EditPetModal({
  pet,
  onClose,
  onSaved,
}: {
  pet: PetSummary;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tagType = pet.tag?.tag_type ?? "collar_tag";

  const [form, setForm] = useState({
    name: pet.name ?? "",
    species: pet.species ?? "dog",
    breed_or_morph: pet.breed_or_morph ?? "",
    sex: pet.sex ?? "unknown",
    age_years: pet.age_years?.toString() ?? "",
    colour: pet.colour ?? "",
    microchip: pet.microchip ?? "",
    allergies: pet.allergies ?? "",
    medication: pet.medication ?? "",
    behaviour: pet.behaviour ?? "",
    public_notes: pet.public_notes ?? "",
    emergency_notes: pet.emergency_notes ?? "",
    show_phone: pet.show_phone,
    // campos por tag_type (Etapa 19)
    vet_name: pet.vet_name ?? "",
    travel_notes: pet.travel_notes ?? "",
    airline_approved: pet.airline_approved ?? false,
    habitat_temp_min: pet.habitat_temp_min?.toString() ?? "",
    habitat_temp_max: pet.habitat_temp_max?.toString() ?? "",
    feeding_schedule: pet.feeding_schedule ?? "",
    handling_notes: pet.handling_notes ?? "",
    lighting_notes: pet.lighting_notes ?? "",
    humidity_notes: pet.humidity_notes ?? "",
    critical_conditions: pet.critical_conditions ?? "",
    critical_medication: pet.critical_medication ?? "",
    blood_type: pet.blood_type ?? "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(pet.photo_url);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let photoUrl = pet.photo_url ?? undefined;
      if (photoFile) photoUrl = await uploadPetPhoto(photoFile);

      const payload: PetUpdatePayload = {
        name: form.name,
        species: form.species,
        breed_or_morph: form.breed_or_morph || null,
        sex: form.sex || null,
        age_years: form.age_years ? Number(form.age_years) : null,
        colour: form.colour || null,
        microchip: form.microchip || null,
        photo_url: photoUrl ?? null,
        allergies: form.allergies || null,
        medication: form.medication || null,
        behaviour: form.behaviour || null,
        public_notes: form.public_notes || null,
        emergency_notes: form.emergency_notes || null,
        show_phone: form.show_phone,
        // campos por tag_type
        vet_name: form.vet_name || null,
        travel_notes: form.travel_notes || null,
        airline_approved: form.airline_approved,
        habitat_temp_min: form.habitat_temp_min ? Number(form.habitat_temp_min) : null,
        habitat_temp_max: form.habitat_temp_max ? Number(form.habitat_temp_max) : null,
        feeding_schedule: form.feeding_schedule || null,
        handling_notes: form.handling_notes || null,
        lighting_notes: form.lighting_notes || null,
        humidity_notes: form.humidity_notes || null,
        critical_conditions: form.critical_conditions || null,
        critical_medication: form.critical_medication || null,
        blood_type: form.blood_type || null,
      };
      await updatePet(pet.id, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-card bg-white p-5 shadow-lg sm:rounded-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Edit {pet.name}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="flex flex-col gap-3">
          {/* Foto */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-28 items-center justify-center overflow-hidden rounded-input border-2 border-dashed border-slate-300 bg-taloa-bg text-slate-400 hover:border-taloa-primary"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt={pet.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-sm">
                <ImagePlus className="h-5 w-5" /> Add a photo
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

          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Species</label>
              <select className={inputClass} value={form.species} onChange={(e) => set("species", e.target.value)}>
                {SPECIES_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sex</label>
              <select className={inputClass} value={form.sex} onChange={(e) => set("sex", e.target.value)}>
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Breed / morph</label>
              <input className={inputClass} value={form.breed_or_morph} onChange={(e) => set("breed_or_morph", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Age (years)</label>
              <input className={inputClass} type="number" min={0} value={form.age_years} onChange={(e) => set("age_years", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Colour</label>
              <input className={inputClass} value={form.colour} onChange={(e) => set("colour", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Microchip</label>
              <input className={inputClass} value={form.microchip} onChange={(e) => set("microchip", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Allergies</label>
            <input className={inputClass} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Medication</label>
            <input className={inputClass} value={form.medication} onChange={(e) => set("medication", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Behaviour</label>
            <input className={inputClass} value={form.behaviour} onChange={(e) => set("behaviour", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Public notes</label>
            <textarea className={`${inputClass} min-h-16 resize-none`} value={form.public_notes} onChange={(e) => set("public_notes", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Emergency notes</label>
            <textarea className={`${inputClass} min-h-16 resize-none`} value={form.emergency_notes} onChange={(e) => set("emergency_notes", e.target.value)} />
          </div>

          {/* ── Campos por tag_type (Etapa 19) ── */}
          {tagType === "travel_id" && (
            <div className="flex flex-col gap-3 rounded-input border border-slate-200 bg-taloa-bg/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-taloa-primary">
                Travel ID
              </p>
              <div>
                <label className={labelClass}>Vet</label>
                <input className={inputClass} value={form.vet_name} onChange={(e) => set("vet_name", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Travel instructions</label>
                <textarea className={`${inputClass} min-h-16 resize-none`} value={form.travel_notes} onChange={(e) => set("travel_notes", e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.airline_approved} onChange={(e) => set("airline_approved", e.target.checked)} />
                Airline approved
              </label>
            </div>
          )}

          {tagType === "habitat_id" && (
            <div className="flex flex-col gap-3 rounded-input border border-slate-200 bg-taloa-bg/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-taloa-primary">
                Habitat ID
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Temp min (°C)</label>
                  <input className={inputClass} type="number" value={form.habitat_temp_min} onChange={(e) => set("habitat_temp_min", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Temp max (°C)</label>
                  <input className={inputClass} type="number" value={form.habitat_temp_max} onChange={(e) => set("habitat_temp_max", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Feeding schedule</label>
                <textarea className={`${inputClass} min-h-16 resize-none`} value={form.feeding_schedule} onChange={(e) => set("feeding_schedule", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Handling</label>
                <textarea className={`${inputClass} min-h-16 resize-none`} value={form.handling_notes} onChange={(e) => set("handling_notes", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Lighting</label>
                  <input className={inputClass} value={form.lighting_notes} onChange={(e) => set("lighting_notes", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Humidity</label>
                  <input className={inputClass} value={form.humidity_notes} onChange={(e) => set("humidity_notes", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {tagType === "emergency_card" && (
            <div className="flex flex-col gap-3 rounded-input border border-taloa-alert/30 bg-taloa-alert/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-taloa-alert">
                Emergency Card
              </p>
              <div>
                <label className={labelClass}>Critical conditions</label>
                <textarea className={`${inputClass} min-h-16 resize-none`} value={form.critical_conditions} onChange={(e) => set("critical_conditions", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Emergency medication</label>
                <input className={inputClass} value={form.critical_medication} onChange={(e) => set("critical_medication", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Blood type</label>
                <input className={inputClass} value={form.blood_type} onChange={(e) => set("blood_type", e.target.value)} />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.show_phone} onChange={(e) => set("show_phone", e.target.checked)} />
            Show my phone on the public profile
          </label>

          {error && <p className="text-sm text-taloa-alert">{error}</p>}

          <div className="mt-2 flex gap-3">
            <button type="button" onClick={onClose} className="h-12 flex-1 rounded-input border border-slate-300 font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="h-12 flex-[2] rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60">
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
