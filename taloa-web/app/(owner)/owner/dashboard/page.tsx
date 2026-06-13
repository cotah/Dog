import { apiFetchServer } from "@/lib/api/server";
import { createClient } from "@/lib/supabase/server";

import { LogoutButton } from "./logout-button";

type Me = { id: string; email: string | null; role: string };

// Dashboard do dono (placeholder — sera construido na Etapa 7).
// Aqui ele tambem valida a cadeia completa: chama /v1/auth/me no FastAPI
// usando o JWT do Supabase, provando que o backend valida o token.
export default async function OwnerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let me: Me | null = null;
  let apiError: string | null = null;
  try {
    me = await apiFetchServer<Me>("/v1/auth/me");
  } catch (err) {
    apiError = err instanceof Error ? err.message : "API unreachable";
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-taloa-primary">Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="rounded-card bg-white p-6 shadow-sm">
        <p className="text-slate-700">
          Welcome, <strong>{user?.email}</strong> 🐾
        </p>

        <div className="mt-4 rounded-input bg-taloa-bg p-4 text-sm">
          <p className="mb-1 font-medium text-slate-600">
            API check (FastAPI validated the Supabase JWT):
          </p>
          {apiError ? (
            <p className="text-taloa-alert">⚠ {apiError}</p>
          ) : (
            <ul className="text-slate-600">
              <li>user_id: {me?.id}</li>
              <li>email: {me?.email}</li>
              <li>role: {me?.role}</li>
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
