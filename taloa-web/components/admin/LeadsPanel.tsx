"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateLeadStatus } from "@/lib/api/admin";
import type { AdminLeadRow } from "@/types/admin";

const LEAD_STATUSES = ["new", "contacted", "converted", "lost"];

export function LeadsPanel({ leads }: { leads: AdminLeadRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function onChange(id: string, status: string) {
    setBusy(id);
    try {
      await updateLeadStatus(id, status);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">Leads ({leads.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">Service</th>
              <th className="py-2 pr-3">Owner</th>
              <th className="py-2 pr-3">Pet</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="py-2 pr-3 capitalize">
                  {l.service_type.replace(/_/g, " ")}
                </td>
                <td className="py-2 pr-3 text-slate-500">
                  {l.owner_name ?? l.owner_email ?? "—"}
                </td>
                <td className="py-2 pr-3">{l.pet_name ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-500">
                  {l.created_at ? l.created_at.slice(0, 10) : "—"}
                </td>
                <td className="py-2 pr-3">
                  <select
                    value={l.status ?? "new"}
                    disabled={busy === l.id}
                    onChange={(e) => onChange(l.id, e.target.value)}
                    className="rounded-input border border-slate-300 px-2 py-1 text-xs capitalize outline-none focus:border-taloa-primary"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  No leads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
