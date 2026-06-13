import Link from "next/link";

import { getPublicTag } from "@/lib/api/public";

import { ActivateForm } from "./activate-form";

export const dynamic = "force-dynamic";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-4">
      <div className="w-full rounded-card bg-white p-8 text-center shadow-sm">
        {children}
      </div>
    </main>
  );
}

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ tagCode: string }>;
}) {
  const { tagCode } = await params;
  const tag = await getPublicTag(tagCode);

  if (!tag) {
    return (
      <Centered>
        <h1 className="text-xl font-bold text-slate-800">Tag not found</h1>
        <p className="mt-2 text-slate-500">
          We couldn&apos;t find a TALOA tag with this code.
        </p>
      </Centered>
    );
  }

  // Tag ja ativada (ou perdida/desativada) — nao reativa
  if (tag.status !== "inactive") {
    return (
      <Centered>
        <h1 className="text-xl font-bold text-slate-800">
          This tag is already set up
        </h1>
        <p className="mt-2 text-slate-500">
          This tag is not available for activation.
        </p>
        <Link
          href={`/t/${tag.tag_code}`}
          className="mt-4 inline-block font-medium text-taloa-primary"
        >
          View the pet profile
        </Link>
      </Centered>
    );
  }

  return <ActivateForm tagCode={tag.tag_code} />;
}
