"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

// Cliente Supabase do browser — SOMENTE Auth e Storage.
// Nenhum acesso de dados de negocio: isso vai pela API (FastAPI).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
