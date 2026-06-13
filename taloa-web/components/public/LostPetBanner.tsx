import { AlertTriangle } from "lucide-react";

import type { LostInfo } from "@/types/tag";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Banner vermelho com pulso para o modo "perdido".
export function LostPetBanner({
  petName,
  lost,
}: {
  petName: string;
  lost: LostInfo | null;
}) {
  const lastSeen = formatDate(lost?.last_seen_at ?? null);

  return (
    <div className="rounded-card bg-taloa-alert p-5 text-white shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 animate-pulse" />
        <h2 className="text-xl font-bold uppercase tracking-wide">
          This pet is lost
        </h2>
      </div>
      <p className="mt-2 text-white/90">
        <strong>{petName}</strong> is missing. If you found this pet, please
        contact the owner right away.
      </p>

      {(lost?.last_seen_area || lastSeen || lost?.description) && (
        <div className="mt-3 space-y-1 rounded-input bg-white/15 p-3 text-sm">
          {lost?.last_seen_area && (
            <p>
              <span className="font-semibold">Last seen:</span>{" "}
              {lost.last_seen_area}
              {lastSeen ? ` (${lastSeen})` : ""}
            </p>
          )}
          {lost?.description && <p>{lost.description}</p>}
        </div>
      )}
    </div>
  );
}
