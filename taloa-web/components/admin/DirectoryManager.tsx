"use client";

import { Image as ImageIcon, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  createProvider,
  deleteProvider,
  updateProvider,
  uploadProviderImage,
} from "@/lib/api/admin";
import { DIRECTORY_CATEGORIES } from "@/lib/directory";
import type { AdminProvider, ProviderPayload } from "@/types/directory";

const inputClass =
  "w-full rounded-input border border-slate-300 px-3 py-2 text-sm outline-none focus:border-taloa-primary";

function emptyForm() {
  return {
    name: "",
    category: "grooming",
    description: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    area: "",
    eircode: "",
    latitude: "",
    longitude: "",
    species: "",
    languages: "",
    hours: "",
    price_range: "",
    partner_discount: "",
    photo_url: "",
    logo_url: "",
    rating: "",
    notes: "",
    emergency_24h: false,
    is_verified: false,
    is_featured: false,
    is_taloa_partner: false,
  };
}
type Form = ReturnType<typeof emptyForm>;

export function DirectoryManager({ providers }: { providers: AdminProvider[] }) {
  const t = useTranslations("directory");
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onPickImage(
    field: "logo_url" | "photo_url",
    file: File | undefined,
  ) {
    if (!file) return;
    setUploading(field);
    try {
      const url = await uploadProviderImage(file);
      set(field, url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(p: AdminProvider) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description ?? "",
      phone: p.phone ?? "",
      email: p.email ?? "",
      website: p.website ?? "",
      address: p.address ?? "",
      area: p.area ?? "",
      eircode: p.eircode ?? "",
      latitude: p.latitude != null ? String(p.latitude) : "",
      longitude: p.longitude != null ? String(p.longitude) : "",
      species: (p.species_supported ?? []).join(", "),
      languages: (p.languages ?? []).join(", "),
      hours: p.hours ?? "",
      price_range: p.price_range ?? "",
      partner_discount: p.partner_discount ?? "",
      photo_url: p.photo_url ?? "",
      logo_url: p.logo_url ?? "",
      rating: p.rating != null ? String(p.rating) : "",
      notes: p.notes ?? "",
      emergency_24h: p.emergency_24h,
      is_verified: p.is_verified,
      is_featured: p.is_featured,
      is_taloa_partner: p.is_taloa_partner,
    });
    setShowForm(true);
  }

  function csv(v: string): string[] | null {
    const arr = v.split(",").map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: ProviderPayload = {
        name: form.name,
        category: form.category,
        description: form.description || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        address: form.address || null,
        area: form.area || null,
        eircode: form.eircode || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        species_supported: csv(form.species),
        languages: csv(form.languages),
        hours: form.hours || null,
        price_range: form.price_range || null,
        partner_discount: form.partner_discount || null,
        photo_url: form.photo_url || null,
        logo_url: form.logo_url || null,
        rating: form.rating ? Number(form.rating) : null,
        notes: form.notes || null,
        emergency_24h: form.emergency_24h,
        is_verified: form.is_verified,
        is_featured: form.is_featured,
        is_taloa_partner: form.is_taloa_partner,
      };
      if (editingId) await updateProvider(editingId, payload);
      else await createProvider(payload);
      setShowForm(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function quickToggle(p: AdminProvider, field: keyof ProviderPayload) {
    await updateProvider(p.id, { [field]: !p[field as keyof AdminProvider] });
    router.refresh();
  }

  async function onDeactivate(p: AdminProvider) {
    if (p.is_active) await deleteProvider(p.id);
    else await updateProvider(p.id, { is_active: true });
    router.refresh();
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return providers.filter(
      (p) =>
        (!catFilter || p.category === catFilter) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [providers, search, catFilter]);

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">
          Directory ({providers.length})
        </h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded-input bg-taloa-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-taloa-secondary"
        >
          <Plus className="h-4 w-4" /> Add provider
        </button>
      </div>

      {/* Busca + filtro */}
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="h-[38px] rounded-input border border-slate-300 px-2 text-sm text-slate-600"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {DIRECTORY_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {t.has(`cat.${c.slug}`) ? t(`cat.${c.slug}`) : c.slug}
            </option>
          ))}
        </select>
      </div>

      {/* Formulario */}
      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-4 flex flex-col gap-2 rounded-input bg-taloa-bg p-3"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input className={inputClass} placeholder="Name *" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} required>
              {DIRECTORY_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {t.has(`cat.${c.slug}`) ? t(`cat.${c.slug}`) : c.slug}
                </option>
              ))}
            </select>
          </div>
          <textarea className={inputClass} placeholder="Description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <input className={inputClass} placeholder="Email (internal — never public)" value={form.email} onChange={(e) => set("email", e.target.value)} />
            <input className={inputClass} placeholder="Website" value={form.website} onChange={(e) => set("website", e.target.value)} />
            <input className={inputClass} placeholder="Area (e.g. Dublin 4)" value={form.area} onChange={(e) => set("area", e.target.value)} />
            <input className={inputClass} placeholder="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            <input className={inputClass} placeholder="Eircode" value={form.eircode} onChange={(e) => set("eircode", e.target.value)} />
            <input className={inputClass} type="number" step="any" min="-90" max="90" placeholder="Latitude (e.g. 53.3498)" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
            <input className={inputClass} type="number" step="any" min="-180" max="180" placeholder="Longitude (e.g. -6.2603)" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
            <input className={inputClass} placeholder="Species (comma: dog, cat, reptile)" value={form.species} onChange={(e) => set("species", e.target.value)} />
            <input className={inputClass} placeholder="Languages (comma: en, pt)" value={form.languages} onChange={(e) => set("languages", e.target.value)} />
            <input className={inputClass} placeholder="Hours" value={form.hours} onChange={(e) => set("hours", e.target.value)} />
            <input className={inputClass} placeholder="Price range (€, €€, €€€)" value={form.price_range} onChange={(e) => set("price_range", e.target.value)} />
            <input className={inputClass} type="number" step="0.1" min="0" max="5" placeholder="Rating (0-5)" value={form.rating} onChange={(e) => set("rating", e.target.value)} />
            <input className={inputClass} placeholder="Partner discount" value={form.partner_discount} onChange={(e) => set("partner_discount", e.target.value)} />
          </div>
          {/* Upload de logo/foto para o Storage (com fallback p/ colar URL). */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["logo_url", "photo_url"] as const).map((field) => (
              <div key={field} className="flex items-center gap-2">
                {form[field] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form[field]}
                    alt={field}
                    className="h-12 w-12 shrink-0 rounded-input object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input bg-slate-100 text-slate-300">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-input border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    {uploading === field
                      ? "Uploading…"
                      : field === "logo_url"
                        ? "Upload logo"
                        : "Upload photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => onPickImage(field, e.target.files?.[0])}
                    />
                  </label>
                  <input
                    className={`${inputClass} mt-1 text-xs`}
                    placeholder={field === "logo_url" ? "or paste Logo URL" : "or paste Photo URL"}
                    value={form[field]}
                    onChange={(e) => set(field, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <input className={inputClass} placeholder="Notes (internal)" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.emergency_24h} onChange={(e) => set("emergency_24h", e.target.checked)} /> 24h</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_verified} onChange={(e) => set("is_verified", e.target.checked)} /> Verified</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.is_taloa_partner} onChange={(e) => set("is_taloa_partner", e.target.checked)} /> TALOA Partner</label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-10 flex-1 rounded-input border border-slate-300 text-sm font-medium text-slate-600">Cancel</button>
            <button type="submit" disabled={busy} className="h-10 flex-1 rounded-input bg-taloa-primary text-sm font-semibold text-white disabled:opacity-60">
              {busy ? "Saving…" : editingId ? "Save" : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <ul className="divide-y">
        {visible.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-700">
                {p.name}
                {p.emergency_24h && <span className="ml-2 rounded-badge bg-taloa-alert/10 px-2 py-0.5 text-xs text-taloa-alert">24h</span>}
                {p.is_featured && <span className="ml-1 rounded-badge bg-amber-100 px-2 py-0.5 text-xs text-amber-600">featured</span>}
                {p.is_taloa_partner && <span className="ml-1 rounded-badge bg-taloa-secondary/10 px-2 py-0.5 text-xs text-taloa-secondary">partner</span>}
                {!p.is_active && <span className="ml-1 rounded-badge bg-slate-100 px-2 py-0.5 text-xs text-slate-400">inactive</span>}
              </p>
              <p className="truncate text-xs text-slate-400">
                {[p.category, p.area, p.phone].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              <button onClick={() => quickToggle(p, "is_verified")} className={`rounded-input px-2 py-1 text-xs ${p.is_verified ? "bg-taloa-primary/10 text-taloa-primary" : "border border-slate-300 text-slate-500"}`}>Verified</button>
              <button onClick={() => quickToggle(p, "is_featured")} className={`rounded-input px-2 py-1 text-xs ${p.is_featured ? "bg-amber-100 text-amber-600" : "border border-slate-300 text-slate-500"}`}>Featured</button>
              <button onClick={() => quickToggle(p, "is_taloa_partner")} className={`rounded-input px-2 py-1 text-xs ${p.is_taloa_partner ? "bg-taloa-secondary/10 text-taloa-secondary" : "border border-slate-300 text-slate-500"}`}>Partner</button>
              <button onClick={() => openEdit(p)} className="rounded-input border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">Edit</button>
              <button onClick={() => onDeactivate(p)} className={`rounded-input px-2 py-1 text-xs font-medium ${p.is_active ? "border border-slate-300 text-slate-600 hover:bg-slate-50" : "bg-taloa-primary text-white"}`}>
                {p.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </li>
        ))}
        {visible.length === 0 && <li className="py-4 text-center text-slate-400">No providers.</li>}
      </ul>
    </div>
  );
}
