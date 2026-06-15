import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { QRGenerator } from "@/components/admin/QRGenerator";
import { apiFetchServer } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function GenerateTagsPage() {
  let next = 1;
  try {
    const res = await apiFetchServer<{ next_number: number }>(
      "/v1/admin/tags/next-number",
    );
    next = res.next_number;
  } catch {
    // fallback: comeca em 1
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-1 text-sm font-medium text-taloa-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to admin
      </Link>
      <QRGenerator initialStart={next} />
    </main>
  );
}
