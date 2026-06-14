"use client";

import { Check, Download, FileText, QrCode, Table } from "lucide-react";
import { useState } from "react";

import { downloadExport, generateTags } from "@/lib/api/qr";

const pad = (n: number) => `TAL-${String(n).padStart(6, "0")}`;

export function QRGenerator({ initialStart }: { initialStart: number }) {
  const [quantity, setQuantity] = useState(5);
  const [start, setStart] = useState(initialStart);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Math.min(100, Math.max(1, quantity || 1));
  const previewFirst = pad(start);
  const previewLast = pad(start + qty - 1);

  async function onGenerate() {
    setBusy(true);
    setError(null);
    try {
      const res = await generateTags(qty, start);
      setCodes(res.tag_codes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStart(start + (codes?.length ?? 0));
    setCodes(null);
  }

  if (codes) {
    return (
      <div className="rounded-card bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-taloa-primary">
          <Check className="h-6 w-6" />
          <h2 className="text-lg font-bold">
            {codes.length} tags created ({codes[0]} – {codes[codes.length - 1]})
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          They are now <strong>inactive</strong> and ready to print and distribute.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <DownloadButton
            label="PNG (zip)"
            Icon={QrCode}
            onClick={() => downloadExport("png", codes)}
          />
          <DownloadButton
            label="PDF A4 labels"
            Icon={FileText}
            onClick={() => downloadExport("pdf", codes)}
            primary
          />
          <DownloadButton
            label="CSV"
            Icon={Table}
            onClick={() => downloadExport("csv", codes)}
          />
        </div>

        <div className="mt-5 max-h-32 overflow-y-auto rounded-input bg-taloa-bg p-3 font-mono text-xs text-slate-500">
          {codes.join("  ·  ")}
        </div>

        <button
          onClick={reset}
          className="mt-5 h-11 w-full rounded-input border border-slate-300 font-medium text-slate-600 hover:bg-slate-50"
        >
          Generate another batch
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-card bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">Generate QR tags</h2>
      <p className="mb-5 text-sm text-slate-500">
        Create a batch of TALOA tags (status inactive).
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Quantity (1–100)
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded-input border border-slate-300 px-3 py-2.5 outline-none focus:border-taloa-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Start number
          </label>
          <input
            type="number"
            min={1}
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            className="w-full rounded-input border border-slate-300 px-3 py-2.5 outline-none focus:border-taloa-primary"
          />
        </div>
      </div>

      <div className="mt-4 rounded-input bg-taloa-bg p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-slate-400">Preview</p>
        <p className="font-mono text-lg font-semibold text-taloa-primary">
          {previewFirst}
          {qty > 1 ? ` – ${previewLast}` : ""}
        </p>
        <p className="text-xs text-slate-400">
          URL: https://taloa.ie/t/{previewFirst}
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-taloa-alert">{error}</p>}

      <button
        onClick={onGenerate}
        disabled={busy}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-input bg-taloa-primary font-semibold text-white hover:bg-taloa-secondary disabled:opacity-60"
      >
        <Download className="h-5 w-5" />
        {busy ? "Generating…" : `Generate ${qty} tag${qty > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

function DownloadButton({
  label,
  Icon,
  onClick,
  primary,
}: {
  label: string;
  Icon: typeof QrCode;
  onClick: () => Promise<void> | void;
  primary?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  async function handle() {
    setBusy(true);
    try {
      await onClick();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={handle}
      disabled={busy}
      className={`flex h-20 flex-col items-center justify-center gap-1 rounded-input border text-sm font-medium disabled:opacity-60 ${
        primary
          ? "border-taloa-primary bg-taloa-primary/5 text-taloa-primary"
          : "border-slate-300 text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-5 w-5" />
      {busy ? "…" : label}
    </button>
  );
}
