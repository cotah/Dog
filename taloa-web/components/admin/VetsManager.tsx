"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createVet, updateVet } from "@/lib/api/admin";
import type { VetClinic, VetPayload } from "@/types/admin";

const inputClass =
  "w-full rounded-input border border-slate-300 px-3 py-2 text-sm outline-none focus:border-taloa-primary";

function emptyForm() {
  return {
    name: "",
    phone: "",
    area: "",
    address: "",
    species: "",
    hours: "",
    website: "",
    emergency_24h: false,
  };
}

export function VetsManager({ vets }: { vets: VetClinic[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  function set<K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(v: VetClinic) {
    setEditingId(v.id);
    setForm({
      name: v.name,
      phone: v.phone,
      area: v.area ?? "",
      address: v.address ?? "",
      species: (v.species_supported ?? []).join(", "),
      hours: v.hours ?? "",
      website: v.website ?? "",
      emergency_24h: v.emergency_24h,
    });
    setShowForm(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: VetPayload = {
        name: form.name,
        phone: form.phone,
        area: form.area || null,
        address: form.address || null,
        species_supported: form.species
          ? form.species.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        hours: form.hours || null,
        website: form.website || null,
        emergency_24h: form.emergency_24h,
      };
      if (editingId) await updateVet(editingId, payload);
      else await createVet(payload);
      setShowForm(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(v: VetClinic) {
    await updateVet(v.id, { is_active: !v.is_active });
    router.refresh();
  }

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Vet clinics ({vets.length})</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded-input bg-taloa-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-taloa-secondary"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-4 flex flex-col gap-2 rounded-input bg-taloa-bg p-3">
          <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
            <input className={inputClass} placeholder="Area (e.g. Dublin 4)" value={form.area} onChange={(e) => set("area", e.target.value)} />
          </div>
          <input className={inputClass} placeholder="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          <input className={inputClass} placeholder="Species (comma-separated: dog, cat, reptile)" value={form.species} onChange={(e) => set("species", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClass} placeholder="Hours" value={form.hours} onChange={(e) => set("hours", e.target.value)} />
            <input className={inputClass} placeholder="Website" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.emergency_24h} onChange={(e) => set("emergency_24h", e.target.checked)} />
            Open 24h (emergency)
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-10 flex-1 rounded-input border border-slate-300 text-sm font-medium text-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="h-10 flex-1 rounded-input bg-taloa-primary text-sm font-semibold text-white disabled:opacity-60">
              {busy ? "Saving…" : editingId ? "Save" : "Create"}
            </button>
          </div>
        </form>
      )}

      <ul className="divide-y">
        {vets.map((v) => (
          <li key={v.id} className="flex items-center justify-between py-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-700">
                {v.name}
                {v.emergency_24h && (
                  <span className="ml-2 rounded-badge bg-taloa-alert/10 px-2 py-0.5 text-xs text-taloa-alert">24h</span>
                )}
                {!v.is_active && (
                  <span className="ml-2 rounded-badge bg-slate-100 px-2 py-0.5 text-xs text-slate-400">inactive</span>
                )}
              </p>
              <p className="text-xs text-slate-400">
                {[v.area, v.phone].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => openEdit(v)} className="rounded-input border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                Edit
              </button>
              <button
                onClick={() => toggleActive(v)}
                className={`rounded-input px-2 py-1 text-xs font-medium ${
                  v.is_active
                    ? "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    : "bg-taloa-primary text-white"
                }`}
              >
                {v.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </li>
        ))}
        {vets.length === 0 && (
          <li className="py-4 text-center text-slate-400">No clinics yet.</li>
        )}
      </ul>
    </div>
  );
}
