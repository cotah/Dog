import type { AdminFoundReportRow } from "@/types/admin";

// Painel de "found reports" no admin. Read-only: o admin acompanha quem
// reportou ter encontrado um pet. O dono e quem marca como found no dashboard.
export function FoundReportsPanel({
  reports,
}: {
  reports: AdminFoundReportRow[];
}) {
  const open = reports.filter((r) => r.status === "open").length;

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">
        Found reports ({reports.length})
        {open > 0 && (
          <span className="ml-2 rounded-full bg-taloa-alert/10 px-2 py-0.5 text-xs font-semibold text-taloa-alert">
            {open} open
          </span>
        )}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">Pet</th>
              <th className="py-2 pr-3">Area</th>
              <th className="py-2 pr-3">Finder</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-3">
                  {r.pet_name ?? "—"}
                  {r.owner_email && (
                    <span className="block text-xs text-slate-400">
                      {r.owner_email}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-500">
                  {r.found_area ?? "—"}
                  {r.notes && (
                    <span className="mt-0.5 block max-w-xs truncate text-xs italic text-slate-400">
                      “{r.notes}”
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-500">
                  {r.finder_phone ?? "—"}
                </td>
                <td className="py-2 pr-3 text-slate-500">
                  {r.created_at ? r.created_at.slice(0, 10) : "—"}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      r.status === "open"
                        ? "bg-taloa-alert/10 text-taloa-alert"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.status ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  No found reports yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
