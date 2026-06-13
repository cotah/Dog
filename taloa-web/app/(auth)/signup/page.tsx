"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch, ApiError } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gdpr: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.gdpr) {
      setError("You must accept the privacy terms (GDPR) to continue.");
      return;
    }
    setLoading(true);

    try {
      // 1. Cria a conta no backend (FastAPI cria auth user + perfil)
      await apiFetch("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          gdpr_consent: form.gdpr,
        }),
      });

      // 2. Faz login pelo Supabase Auth para criar a sessao
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) {
        setError("Account created. Please log in.");
        setLoading(false);
        router.push("/login");
        return;
      }

      router.push("/owner/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-taloa-primary">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Smart safety for your pet, starting in Dublin.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-input border border-slate-300 px-3 py-2 outline-none focus:border-taloa-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-input border border-slate-300 px-3 py-2 outline-none focus:border-taloa-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-input border border-slate-300 px-3 py-2 outline-none focus:border-taloa-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full rounded-input border border-slate-300 px-3 py-2 outline-none focus:border-taloa-primary"
            />
            <p className="mt-1 text-xs text-slate-400">Minimum 8 characters.</p>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.gdpr}
              onChange={(e) => update("gdpr", e.target.checked)}
              className="mt-1"
            />
            <span>I agree to the processing of my data (GDPR).</span>
          </label>

          {error && <p className="text-sm text-taloa-alert">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 rounded-input bg-taloa-primary font-medium text-white hover:bg-taloa-secondary disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-taloa-primary">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
