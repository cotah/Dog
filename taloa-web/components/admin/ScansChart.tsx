"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ScanDaily } from "@/types/admin";

export function ScansChart({ data }: { data: ScanDaily[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.date.slice(5) })); // MM-DD
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-card bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-800">Scans — last 30 days</h3>
        <span className="text-sm text-slate-400">{total} total</span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip
              labelFormatter={(l) => `Day ${l}`}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="count" fill="#1A3A5C" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
