"use client";

import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import {
  deleteActivity,
  deleteHealth,
  getDiary,
  getDiarySummary,
  getHealth,
  getShedding,
} from "@/lib/api/diary";
import { templateFor } from "@/lib/diary/species-templates";
import type {
  Activity,
  DiarySummary,
  HealthRecord,
  SheddingRecord,
} from "@/types/diary";

import { AddActivityModal } from "./AddActivityModal";
import { HealthModal } from "./HealthModal";
import { SheddingModal } from "./SheddingModal";
import {
  ActivityIcon,
  daysUntil,
  fmtDate,
  healthStatus,
  localDay,
  STATUS_CLASSES,
} from "./shared";

type Tab = "diary" | "health" | "shedding" | "timeline";

export function DiaryView({
  petId,
  species,
}: {
  petId: string;
  species: string;
}) {
  const t = useTranslations("diary");
  const locale = useLocale();
  const sheddingCfg = templateFor(species).shedding;

  const [tab, setTab] = useState<Tab>("diary");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<DiarySummary | null>(null);
  const [health, setHealth] = useState<HealthRecord[]>([]);
  const [shedding, setShedding] = useState<SheddingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingActivity, setAddingActivity] = useState(false);
  const [healthModal, setHealthModal] = useState<HealthRecord | "new" | null>(null);
  const [sheddingModal, setSheddingModal] = useState<SheddingRecord | "new" | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [a, s, h, sh] = await Promise.all([
      getDiary(petId).catch(() => []),
      getDiarySummary(petId).catch(() => null),
      getHealth(petId).catch(() => []),
      getShedding(petId).catch(() => []),
    ]);
    setActivities(a);
    setSummary(s);
    setHealth(h);
    setShedding(sh);
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs: Tab[] = ["diary", "health", ...(sheddingCfg ? (["shedding"] as Tab[]) : []), "timeline"];

  return (
    <div>
      {/* Abas */}
      <div className="mb-5 flex gap-1 border-b border-slate-200">
        {tabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === tb
                ? "border-taloa-primary text-taloa-primary"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t(`tab${tb[0].toUpperCase()}${tb.slice(1)}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {tab === "diary" && (
            <DiaryTab
              activities={activities}
              summary={summary}
              locale={locale}
              onAdd={() => setAddingActivity(true)}
              onDelete={async (id) => {
                await deleteActivity(petId, id).catch(() => {});
                load();
              }}
            />
          )}
          {tab === "health" && (
            <HealthTab
              records={health}
              onAdd={() => setHealthModal("new")}
              onEdit={(r) => setHealthModal(r)}
              onDelete={async (id) => {
                await deleteHealth(petId, id).catch(() => {});
                load();
              }}
            />
          )}
          {tab === "shedding" && sheddingCfg && (
            <SheddingTab
              records={shedding}
              labelKey={sheddingCfg.labelKey}
              usesIntensity={sheddingCfg.field === "intensity"}
              onAdd={() => setSheddingModal("new")}
              onClose={(r) => setSheddingModal(r)}
            />
          )}
          {tab === "timeline" && (
            <TimelineTab activities={activities} health={health} shedding={shedding} />
          )}
        </>
      )}

      {addingActivity && (
        <AddActivityModal
          petId={petId}
          species={species}
          onClose={() => setAddingActivity(false)}
          onSaved={load}
        />
      )}
      {healthModal && (
        <HealthModal
          petId={petId}
          existing={healthModal === "new" ? undefined : healthModal}
          onClose={() => setHealthModal(null)}
          onSaved={load}
        />
      )}
      {sheddingModal && sheddingCfg && (
        <SheddingModal
          petId={petId}
          config={sheddingCfg}
          existing={sheddingModal === "new" ? undefined : sheddingModal}
          onClose={() => setSheddingModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

// ── Diary tab: vista semanal + lista de atividades ──────────
function DiaryTab({
  activities,
  summary,
  locale,
  onAdd,
  onDelete,
}: {
  activities: Activity[];
  summary: DiarySummary | null;
  locale: string;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("diary");

  // Barra seg-dom da semana atual: minutos de passeio por dia.
  const week = useMemo(() => {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // 0 = segunda
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - dow);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { key: localDay(d.toISOString()), date: d, minutes: 0 };
    });
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const a of activities) {
      if (a.activity_type === "walk" && a.occurred_at && a.duration_minutes) {
        const slot = byKey.get(localDay(a.occurred_at));
        if (slot) slot.minutes += a.duration_minutes;
      }
    }
    return days;
  }, [activities]);

  const maxMin = Math.max(60, ...week.map((d) => d.minutes));
  const streak = useMemo(() => computeStreak(activities), [activities]);
  const wd = new Intl.DateTimeFormat(locale, { weekday: "short" });

  return (
    <div className="flex flex-col gap-5">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label={t("weekTitle")}
          value={`${summary?.walk_minutes_week ?? 0} min`}
        />
        <Stat
          label={t("streak")}
          value={streak > 0 ? String(streak) : t("streakNone")}
        />
        <Stat
          label={t("lastBath")}
          value={summary?.last_bath_at ? fmtDate(summary.last_bath_at) : t("never")}
        />
        <Stat
          label={t("lastWeight")}
          value={
            summary?.last_weight_kg != null
              ? `${summary.last_weight_kg} kg`
              : t("never")
          }
          hint={weightHint(summary, t)}
        />
      </div>

      {/* Barra semanal */}
      <div className="rounded-card border border-slate-200 bg-white p-4">
        <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
          {week.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-taloa-primary/80"
                  style={{ height: `${(d.minutes / maxMin) * 100}%` }}
                  title={`${d.minutes} min`}
                />
              </div>
              <span className="text-[10px] capitalize text-slate-400">
                {wd.format(d.date)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onAdd}
        className="flex h-11 items-center justify-center gap-1.5 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary"
      >
        <Plus className="h-4 w-4" /> {t("addActivity")}
      </button>

      {/* Lista recente */}
      {activities.length === 0 ? (
        <Empty text={t("emptyDiary")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {activities.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-input border border-slate-100 bg-white px-3 py-2"
            >
              <span className="text-taloa-primary">
                <ActivityIcon type={a.activity_type} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700">
                  {t(`types.${a.activity_type}`)}
                  {a.duration_minutes ? ` · ${a.duration_minutes} min` : ""}
                  {a.distance_meters ? ` · ${a.distance_meters} m` : ""}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {fmtDate(a.occurred_at)}
                  {a.notes ? ` · ${a.notes}` : ""}
                  {a.walker_name ? ` · ${a.walker_name}` : ""}
                </p>
              </div>
              <button
                onClick={() => onDelete(a.id)}
                aria-label={t("delete")}
                className="text-slate-300 hover:text-taloa-alert"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Health tab ──────────────────────────────────────────────
function HealthTab({
  records,
  onAdd,
  onEdit,
  onDelete,
}: {
  records: HealthRecord[];
  onAdd: () => void;
  onEdit: (r: HealthRecord) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("diary");
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onAdd}
        className="flex h-11 items-center justify-center gap-1.5 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary"
      >
        <Plus className="h-4 w-4" /> {t("addHealth")}
      </button>

      {records.length === 0 ? (
        <Empty text={t("emptyHealth")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((r) => {
            const st = healthStatus(r.next_due_date);
            const days = daysUntil(r.next_due_date);
            return (
              <li
                key={r.id}
                className="rounded-input border border-slate-100 bg-white px-3 py-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700">{r.title}</p>
                    <p className="text-xs text-slate-400">
                      {t(`healthTypes.${r.record_type}`)} · {fmtDate(r.date)}
                      {r.vet_name ? ` · ${r.vet_name}` : ""}
                    </p>
                  </div>
                  {st && days !== null && (
                    <span
                      className={`shrink-0 rounded-badge px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASSES[st]}`}
                    >
                      {st === "overdue"
                        ? t("overdue", { count: Math.abs(days) })
                        : days === 0
                          ? t("dueToday")
                          : t("dueIn", { count: days })}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => onEdit(r)}
                    className="text-xs font-medium text-taloa-primary"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    className="text-xs font-medium text-slate-400 hover:text-taloa-alert"
                  >
                    {t("delete")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Shedding tab ────────────────────────────────────────────
function SheddingTab({
  records,
  labelKey,
  usesIntensity,
  onAdd,
  onClose,
}: {
  records: SheddingRecord[];
  labelKey: "shedding" | "ecdysis" | "molt";
  usesIntensity: boolean;
  onAdd: () => void;
  onClose: (r: SheddingRecord) => void;
}) {
  const t = useTranslations("diary");
  const latest = records[0];
  const ongoing = latest && !latest.ended_at ? latest : null;
  const lastKey =
    labelKey === "ecdysis" ? "lastEcdysis" : labelKey === "molt" ? "lastMolt" : "lastShedding";

  return (
    <div className="flex flex-col gap-4">
      {latest && (
        <div className="rounded-card border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{t(lastKey)}</p>
          <p className="mt-1 text-base font-semibold text-slate-800">
            {ongoing
              ? t("ongoingSince", { date: fmtDate(latest.started_at) })
              : fmtDate(latest.ended_at ?? latest.started_at)}
          </p>
          {!ongoing && (
            <p className="mt-0.5 text-xs text-slate-400">
              {usesIntensity
                ? latest.intensity
                  ? `${t("intensity")}: ${t(`intensity${cap(latest.intensity)}`)}`
                  : ""
                : `${t("completeQ")} ${latest.was_complete ? t("complete") : t("partial")}`}
            </p>
          )}
        </div>
      )}

      {ongoing ? (
        <button
          onClick={() => onClose(ongoing)}
          className="flex h-11 items-center justify-center gap-1.5 rounded-input border border-taloa-primary font-semibold text-taloa-primary hover:bg-taloa-primary/5"
        >
          {t("closePeriod")}
        </button>
      ) : (
        <button
          onClick={onAdd}
          className="flex h-11 items-center justify-center gap-1.5 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary"
        >
          <Plus className="h-4 w-4" /> {t("addShedding")}
        </button>
      )}

      {records.length === 0 ? (
        <Empty text={t("emptyShedding")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-input border border-slate-100 bg-white px-3 py-2 text-sm"
            >
              <span className="text-slate-600">
                {fmtDate(r.started_at)}
                {r.ended_at ? ` → ${fmtDate(r.ended_at)}` : ` → …`}
              </span>
              <span className="text-xs text-slate-400">
                {usesIntensity
                  ? r.intensity
                    ? t(`intensity${cap(r.intensity)}`)
                    : ""
                  : r.ended_at
                    ? r.was_complete
                      ? t("complete")
                      : t("partial")
                    : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Timeline tab ────────────────────────────────────────────
type TimelineItem = {
  id: string;
  kind: "activity" | "health" | "shedding";
  date: string;
  label: string;
  sub: string;
};

function TimelineTab({
  activities,
  health,
  shedding,
}: {
  activities: Activity[];
  health: HealthRecord[];
  shedding: SheddingRecord[];
}) {
  const t = useTranslations("diary");
  const [filter, setFilter] = useState<"all" | "activity" | "health" | "shedding">(
    "all",
  );

  const items: TimelineItem[] = useMemo(() => {
    const out: TimelineItem[] = [];
    for (const a of activities)
      out.push({
        id: `a-${a.id}`,
        kind: "activity",
        date: a.occurred_at ?? a.created_at ?? "",
        label: t(`types.${a.activity_type}`),
        sub: [a.duration_minutes ? `${a.duration_minutes} min` : "", a.notes ?? ""]
          .filter(Boolean)
          .join(" · "),
      });
    for (const h of health)
      out.push({
        id: `h-${h.id}`,
        kind: "health",
        date: h.date,
        label: h.title,
        sub: t(`healthTypes.${h.record_type}`),
      });
    for (const s of shedding)
      out.push({
        id: `s-${s.id}`,
        kind: "shedding",
        date: s.started_at,
        label: t("shedding"),
        sub: s.ended_at ? `→ ${fmtDate(s.ended_at)}` : "…",
      });
    return out
      .filter((i) => filter === "all" || i.kind === filter)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [activities, health, shedding, filter, t]);

  const filters: Array<typeof filter> = ["all", "activity", "health", "shedding"];
  const filterLabel: Record<string, string> = {
    all: t("filterAll"),
    activity: t("filterActivities"),
    health: t("filterHealth"),
    shedding: t("filterShedding"),
  };
  const dot: Record<string, string> = {
    activity: "bg-taloa-primary",
    health: "bg-emerald-500",
    shedding: "bg-amber-500",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-badge px-3 py-1 text-xs font-medium ${
              filter === f
                ? "bg-taloa-primary text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <Empty text={t("emptyTimeline")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((i) => (
            <li key={i.id} className="flex gap-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[i.kind]}`} />
              <div className="min-w-0 flex-1 border-b border-slate-100 pb-3">
                <p className="text-sm font-medium text-slate-700">{i.label}</p>
                <p className="truncate text-xs text-slate-400">
                  {fmtDate(i.date)}
                  {i.sub ? ` · ${i.sub}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Helpers de UI ───────────────────────────────────────────
function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-base font-bold text-slate-800">{value}</p>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-card border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
      {text}
    </p>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function computeStreak(activities: Activity[]): number {
  const days = new Set(
    activities.map((a) => localDay(a.occurred_at ?? a.created_at ?? "")).filter(Boolean),
  );
  if (days.size === 0) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Permite que a sequencia comece ontem (se hoje ainda sem registo).
  if (!days.has(localDay(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDay(cursor.toISOString()))) return 0;
  }
  let streak = 0;
  while (days.has(localDay(cursor.toISOString()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function weightHint(
  summary: DiarySummary | null,
  t: ReturnType<typeof useTranslations>,
): string | null {
  if (!summary || summary.weight_change_kg == null) return null;
  const c = summary.weight_change_kg;
  if (c === 0) return t("weightSame");
  return c > 0
    ? t("weightUp", { value: Math.abs(c) })
    : t("weightDown", { value: Math.abs(c) });
}
