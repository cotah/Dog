"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={onLogout}
      className="rounded-input border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
    >
      Log out
    </button>
  );
}
