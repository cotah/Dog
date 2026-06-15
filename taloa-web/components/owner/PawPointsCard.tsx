import { formatDistanceToNow } from "date-fns";
import { PawPrint } from "lucide-react";

import type { PawPointsSummary } from "@/types/owner";

// Rotulos amigaveis para cada tipo de ganho de pontos.
const REASON_LABELS: Record<string, string> = {
  tag_activation: "Tag activated",
  pet_photo: "Photo added",
  pet_vet: "Vet added",
  profile_complete: "Profile completed",
  subscription_renewal: "Subscription renewed",
  referral: "Friend referred",
};

export function PawPointsCard({ data }: { data: PawPointsSummary }) {
  return (
    <section className="rounded-card bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-taloa-primary" />
          <h3 className="font-semibold text-slate-800">Paw Points</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-taloa-primary">
            {data.total}
          </p>
          <p className="text-xs text-slate-400">points</p>
        </div>
      </div>

      {data.transactions.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {data.transactions.map((t, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-slate-700">
                  {REASON_LABELS[t.reason] ?? t.reason}
                </p>
                {t.created_at && (
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(t.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
              <span
                className={`font-semibold ${
                  t.points >= 0 ? "text-taloa-secondary" : "text-taloa-alert"
                }`}
              >
                {t.points >= 0 ? `+${t.points}` : t.points}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No points yet — activate a tag and complete your pet&apos;s profile to
          start earning.
        </p>
      )}

      <p className="mt-4 rounded-input bg-taloa-primary/5 p-3 text-center text-sm font-medium text-taloa-primary">
        Keep completing your profile to earn more points 🐾
      </p>
    </section>
  );
}
