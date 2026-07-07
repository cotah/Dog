"use client";

import { ArrowLeft, FileDown, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  addCustomItem,
  deleteItem,
  deleteTrip,
  downloadTripPdf,
  toggleItem,
} from "@/lib/api/travel";
import type { ChecklistItem, ItemSection, TripDetail } from "@/types/travel";

const SECTIONS: ItemSection[] = ["documents", "transport", "essentials"];

function dueTone(dueDate: string | null): "red" | "amber" | null {
  if (!dueDate) return null;
  const days = Math.ceil(
    (new Date(dueDate + "T00:00:00").getTime() - Date.now()) / 86400000,
  );
  if (days < 0) return "red";
  if (days <= 7) return "amber";
  return null;
}

export function TripChecklist({
  trip,
  onBack,
  onDeleted,
}: {
  trip: TripDetail;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("travelChecklist");
  const [items, setItems] = useState<ChecklistItem[]>(trip.items);
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const checked = items.filter((i) => i.is_checked).length;

  function itemText(item: ChecklistItem): string {
    return item.item_key ? t(`items.${item.item_key}`) : (item.label ?? "");
  }

  async function onToggle(item: ChecklistItem) {
    const updated = await toggleItem(trip.id, item.id, !item.is_checked);
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setBusy(true);
    try {
      const item = await addCustomItem(trip.id, label);
      setItems((prev) => [...prev, item]);
      setNewLabel("");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(item: ChecklistItem) {
    await deleteItem(trip.id, item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function onDeleteTrip() {
    if (!window.confirm(t("confirmDelete"))) return;
    await deleteTrip(trip.id);
    onDeleted();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-taloa-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => downloadTripPdf(trip.id)}
            className="flex items-center gap-1 rounded-input border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
          >
            <FileDown className="h-4 w-4" /> {t("downloadPdf")}
          </button>
          <button
            onClick={onDeleteTrip}
            className="flex items-center gap-1 rounded-input border border-red-200 px-3 py-1.5 text-sm text-red-600"
          >
            <Trash2 className="h-4 w-4" /> {t("deleteTrip")}
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        {t("progress", { checked, total: items.length })}
      </p>

      {SECTIONS.map((section) => {
        const sectionItems = items.filter((i) => i.section === section);
        if (!sectionItems.length) return null;
        return (
          <section key={section} className="mb-5">
            <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-taloa-primary">
              {t(`sections.${section}`)}
            </h4>
            <ul className="space-y-1">
              {sectionItems.map((item) => {
                const tone = item.is_checked ? null : dueTone(item.due_date);
                return (
                  <li
                    key={item.id}
                    className="group flex items-center gap-2 rounded-input px-2 py-1.5 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={() => onToggle(item)}
                      className="h-4 w-4 accent-taloa-primary"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        item.is_checked ? "text-slate-400 line-through" : "text-slate-700"
                      }`}
                    >
                      {itemText(item)}
                    </span>
                    {item.due_date && !item.is_checked && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          tone === "red"
                            ? "bg-red-50 text-red-600"
                            : tone === "amber"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {tone === "red"
                          ? t("overdue")
                          : t("dueBy", { date: item.due_date })}
                      </span>
                    )}
                    <button
                      onClick={() => onRemove(item)}
                      className="invisible text-slate-300 hover:text-red-500 group-hover:visible"
                      aria-label="remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <form onSubmit={onAdd} className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          maxLength={200}
          placeholder={t("addItemPlaceholder")}
          className="flex-1 rounded-input border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !newLabel.trim()}
          className="flex items-center gap-1 rounded-input bg-taloa-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {t("add")}
        </button>
      </form>
    </div>
  );
}
