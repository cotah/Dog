import { LeadsPanel } from "@/components/admin/LeadsPanel";
import { ScansChart } from "@/components/admin/ScansChart";
import { TagsTable } from "@/components/admin/TagsTable";
import { UsersList } from "@/components/admin/UsersList";
import { VetsManager } from "@/components/admin/VetsManager";
import { LogoutButton } from "@/components/LogoutButton";
import { apiFetchServer } from "@/lib/api/server";
import type { AdminOverview } from "@/types/admin";

export const dynamic = "force-dynamic";

function Metric({
  label,
  value,
  accent = "text-slate-800",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  let data: AdminOverview | null = null;
  let error: string | null = null;
  try {
    data = await apiFetchServer<AdminOverview>("/v1/admin/overview");
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load admin data.";
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-taloa-alert">⚠ {error ?? "Something went wrong."}</p>
        <LogoutButton />
      </main>
    );
  }

  const m = data.metrics;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 bg-taloa-admin p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-taloa-primary">TALOA Admin</h1>
          <p className="text-sm text-slate-400">Control panel</p>
        </div>
        <LogoutButton />
      </header>

      {/* Metricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <Metric label="Total tags" value={m.total_tags} />
        <Metric label="Active" value={m.active} accent="text-taloa-primary" />
        <Metric label="Inactive" value={m.inactive} accent="text-slate-400" />
        <Metric label="Lost" value={m.lost} accent="text-taloa-alert" />
        <Metric label="Disabled" value={m.disabled} accent="text-slate-700" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Pets" value={m.total_pets} />
        <Metric label="Users" value={m.total_users} />
        <Metric label="Leads" value={m.total_leads} />
      </div>

      <ScansChart data={data.scans_daily} />
      <TagsTable tags={data.tags} />
      <LeadsPanel leads={data.leads} />
      <VetsManager vets={data.vets} />
      <UsersList users={data.users} />
    </main>
  );
}
