"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateUserRole } from "@/lib/api/admin";
import type { AdminUserRow } from "@/types/admin";

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-taloa-primary/10 text-taloa-primary",
  owner: "bg-slate-100 text-slate-500",
  partner: "bg-taloa-info/10 text-taloa-info",
};

export function UsersList({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function promote(id: string) {
    setBusy(id);
    try {
      await updateUserRole(id, "admin");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">Users ({users.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Joined</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-2 pr-3 text-slate-600">{u.email}</td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-badge px-2 py-0.5 text-xs font-medium capitalize ${
                      ROLE_STYLE[u.role] ?? "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-2 pr-3 text-slate-400">
                  {u.created_at ? u.created_at.slice(0, 10) : "—"}
                </td>
                <td className="py-2 pr-3 text-right">
                  {u.role !== "admin" && (
                    <button
                      onClick={() => promote(u.id)}
                      disabled={busy === u.id}
                      className="rounded-input border border-taloa-primary px-2 py-1 text-xs font-medium text-taloa-primary hover:bg-taloa-primary/5 disabled:opacity-60"
                    >
                      Make admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
