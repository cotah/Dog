"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/Spinner";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(t("invalidCredentials"));
      setLoading(false);
      return;
    }

    const redirect =
      new URLSearchParams(window.location.search).get("redirect") ??
      "/owner/dashboard";
    router.push(redirect);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-taloa-primary">{t("title")}</h1>
        <p className="mb-6 text-sm text-slate-500">{t("subtitle")}</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-input border border-slate-300 px-3 py-2 outline-none focus:border-taloa-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-input border border-slate-300 px-3 py-2 outline-none focus:border-taloa-primary"
            />
          </div>

          {error && <p className="text-sm text-taloa-alert">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12 items-center justify-center gap-2 rounded-input bg-taloa-primary font-medium text-white hover:bg-taloa-secondary disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner /> {t("loggingIn")}
              </>
            ) : (
              t("submit")
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-medium text-taloa-primary">
            {t("signupLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
