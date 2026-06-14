"use client";

import { useState } from "react";

import { TagStatusBadge } from "@/components/public/TagStatusBadge";
import type { AdminTagRow } from "@/types/admin";

const STATUS_FILTERS = ["all", "active", "inactive", "lost", "disabled"] as const;

export function TagsTable({ tags }: { tags: AdminTagRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = tags.filter((t) => {
    const matchStatus = status === "all" || t.status === status;
    const needle = q.trim().toLowerCase();
    const matchSearch =
      needle === "" ||
      t.tag_code.toLowerCase().includes(needle) ||
      (t.owner_email ?? "").toLowerCase().includes(needle) ||
      (t.pet_name ?? "").toLowerCase().includes(needle);
    return matchStatus && matchSearch;
  });

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">Tags ({tags.length})</h3>

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search code, owner, pet…"
          className="flex-1 rounded-input border border-slate-300 px-3 py-2 text-sm outline-none focus:border-taloa-primary"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-input border border-slate-300 px-3 py-2 text-sm capitalize outline-none focus:border-taloa-primary"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">Tag</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Pet</th>
              <th className="py-2 pr-3">Owner</th>
              <th className="py-2 pr-3">Activated</th>
              <th className="py-2 pr-3">Scans</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.tag_code} className="border-b last:border-0">
                <td className="py-2 pr-3 font-mono text-xs">{t.tag_code}</td>
                <td className="py-2 pr-3">
                  <TagStatusBadge status={t.status} />
                </td>
                <td className="py-2 pr-3">{t.pet_name ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-500">{t.owner_email ?? "—"}</td>
                <td className="py-2 pr-3 text-slate-500">
                  {t.activated_at ? t.activated_at.slice(0, 10) : "—"}
                </td>
                <td className="py-2 pr-3">{t.scan_count}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400">
                  No tags match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
