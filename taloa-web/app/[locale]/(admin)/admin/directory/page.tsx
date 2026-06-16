import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { DirectoryManager } from "@/components/admin/DirectoryManager";
import { LogoutButton } from "@/components/LogoutButton";
import { apiFetchServer } from "@/lib/api/server";
import type { AdminProvider } from "@/types/directory";

export const dynamic = "force-dynamic";

export default async function AdminDirectoryPage() {
  let providers: AdminProvider[] = [];
  let error: string | null = null;
  try {
    providers = await apiFetchServer<AdminProvider[]>(
      "/v1/admin/directory?limit=500",
    );
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load directory.";
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-taloa-alert">⚠ {error}</p>
        <LogoutButton />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 bg-taloa-admin p-4">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1 text-sm text-taloa-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-taloa-primary">
            Partners Directory
          </h1>
        </div>
        <LogoutButton />
      </header>

      <DirectoryManager providers={providers} />
    </main>
  );
}
