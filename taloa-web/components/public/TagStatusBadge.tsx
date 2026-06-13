import { cn } from "@/lib/utils";
import type { TagStatus } from "@/types/tag";

const STYLES: Record<TagStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-taloa-primary text-white" },
  lost: { label: "Lost", className: "bg-taloa-alert text-white" },
  inactive: { label: "Inactive", className: "bg-slate-200 text-slate-600" },
  disabled: { label: "Disabled", className: "bg-slate-800 text-white" },
};

export function TagStatusBadge({ status }: { status: TagStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}
