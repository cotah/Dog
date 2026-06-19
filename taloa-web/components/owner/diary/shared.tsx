"use client";

// Helpers partilhados pelos componentes do Pet Diary (Etapa 27):
// mapa de icones por tipo de atividade, badge de saude por proximidade do
// next_due_date, e formatacao de datas.
import {
  CircleDot,
  Droplets,
  Ear,
  FlaskConical,
  Footprints,
  Heart,
  type LucideIcon,
  Pencil,
  Pill,
  Scale,
  Scissors,
  Smile,
  Stethoscope,
  Sun,
  Thermometer,
  Utensils,
  Wind,
} from "lucide-react";

import { ACTIVITY_META } from "@/lib/diary/species-templates";

const ICON_BY_NAME: Record<string, LucideIcon> = {
  footprints: Footprints,
  scissors: Scissors,
  droplets: Droplets,
  ear: Ear,
  smile: Smile,
  "circle-dot": CircleDot,
  stethoscope: Stethoscope,
  pill: Pill,
  scale: Scale,
  utensils: Utensils,
  sun: Sun,
  thermometer: Thermometer,
  "flask-conical": FlaskConical,
  heart: Heart,
  pencil: Pencil,
  wind: Wind,
};

export function ActivityIcon({
  type,
  className = "h-4 w-4",
}: {
  type: string;
  className?: string;
}) {
  const name = ACTIVITY_META[type]?.icon ?? "pencil";
  const Icon = ICON_BY_NAME[name] ?? Pencil;
  return <Icon className={className} />;
}

// Verde: >60 dias · Amarelo: <=60 dias · Vermelho: expirado.
export type HealthStatus = "ok" | "soon" | "overdue";

export function healthStatus(nextDue: string | null): HealthStatus | null {
  if (!nextDue) return null;
  const days = daysUntil(nextDue);
  if (days === null) return null;
  if (days < 0) return "overdue";
  if (days <= 60) return "soon";
  return "ok";
}

export const STATUS_CLASSES: Record<HealthStatus, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  soon: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

export function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const d = new Date(isoDate + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Dia local YYYY-MM-DD de uma data/timestamp ISO.
export function localDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function todayISODate(): string {
  return localDay(new Date().toISOString());
}
