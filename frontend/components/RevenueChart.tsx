"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { API_URL } from "@/lib/supabase";
import type { DashboardFilters } from "@/lib/dashboardFilters";

interface DayPayload {
  dateLabel: string;
  iso: string;
  revenue: number;
}

type TooltipDatum = TooltipProps<number, string>["payload"];

const CHART_MARGIN = { top: 16, right: 12, left: -8, bottom: 0 };

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipDatum;
}) => {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload as DayPayload;
  const value = payload[0].value as number;
  const longDate = row.iso
    ? new Date(row.iso + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : row.dateLabel;

  return (
    <div className="pointer-events-none min-w-[200px] rounded-xl border border-gray-100 bg-white px-4 py-3 text-left shadow-xl">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {longDate}
      </p>
      <p className="mt-1 font-mono text-2xl font-black tabular-nums tracking-tight text-blue-600">
        ${value.toLocaleString()}
      </p>
      <p className="mt-1 text-[11px] font-medium text-emerald-600">
        Recovered revenue
      </p>
    </div>
  );
};

interface Props {
  refreshKey: number;
  filters: DashboardFilters;
}

export default function RevenueChart({ refreshKey, filters }: Props) {
  const [data, setData] = useState<DayPayload[]>([]);
  const [total, setTotal] = useState(0);
  const [focusedIso, setFocusedIso] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/interventions/revenue-series`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date_from: filters.date_from,
            date_to: filters.date_to,
            playbook: filters.playbook || null,
            sort_days: filters.chart_sort_days,
          }),
        });
        const raw = await res.json();

        if (!Array.isArray(raw)) {
          console.error("Revenue data is not an array:", raw);
          return;
        }

        const formatted = raw.map((d: { date: string; revenue: number }) => ({
          dateLabel: new Date(d.date + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          iso: d.date,
          revenue: Math.round(d.revenue),
        }));

        setData(formatted);
        setTotal(formatted.reduce((s, row) => s + row.revenue, 0));
        setFocusedIso(null);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [
    refreshKey,
    filters.date_from,
    filters.date_to,
    filters.playbook,
    filters.chart_sort_days,
  ]);

  const maxRevenue = useMemo(
    () => (data.length ? Math.max(...data.map((d) => d.revenue), 1) : 1),
    [data],
  );

  const avgRevenue =
    data.length && total ? Math.round(total / data.length) : null;

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const Dot = useCallback(
    (dotProps: {
      cx?: number;
      cy?: number;
      payload?: DayPayload;
    }) => {
      const { cx, cy, payload } = dotProps;
      if (cx == null || cy == null || !payload) return null;
      const isFocused = focusedIso === payload.iso;
      const pct = Math.round((payload.revenue / maxRevenue) * 100);

      return (
        <g style={{ cursor: "pointer" }}>
          {/* Hit target */}
          <circle
            cx={cx}
            cy={cy}
            r={14}
            fill="transparent"
            stroke="transparent"
            onClick={() =>
              setFocusedIso((prev) =>
                prev === payload.iso ? null : payload.iso,
              )
            }
          />
          {isFocused && (
            <circle
              cx={cx}
              cy={cy}
              r={13}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={2}
              opacity={0.6}
              className="animate-pulse"
              pointerEvents="none"
            />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={isFocused ? 7 : payload.revenue > 0 ? 4 : 3}
            fill={payload.revenue > 0 ? "#fff" : "#94a3b8"}
            stroke="#2563eb"
            strokeWidth={isFocused ? 3 : 2}
          />
          <title>
            {payload.iso}: ${payload.revenue.toLocaleString()}
            {isFocused ? " (pinned — click to clear)" : " (click to pin)"}{" "}
            · {pct}% of peak
          </title>
        </g>
      );
    },
    [focusedIso, maxRevenue],
  );

  const showBrush = data.length > 14;

  return (
    <div className="dash-panel flex h-full min-h-0 flex-col overflow-hidden bg-white ring-1 ring-gray-100">
      <div className="dash-panel-head flex-wrap gap-y-2 border-b border-gray-50 bg-gray-50/30 backdrop-blur-sm">
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Revenue curve
            </h2>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-gray-900">
              <span className="block sm:inline">
                {filters.date_from} → {filters.date_to}
              </span>
              {focusedIso ? (
                <span className="mt-1 block text-xs font-normal text-brand-600 sm:ml-2 sm:mt-0 sm:inline">
                  Pinned {focusedIso} — click point to clear.
                </span>
              ) : (
                <span className="mt-1 block text-xs font-normal text-gray-400 sm:ml-2 sm:mt-0 sm:inline">
                  Hover for detail · click to pin · brush to zoom.
                </span>
              )}
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {avgRevenue != null && (
              <span
                title="Daily average over selected range"
                className="cursor-help rounded-lg border border-gray-100 bg-gray-50 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-gray-400 shadow-sm"
              >
                avg {fmtCurrency(avgRevenue)}/day
              </span>
            )}
            <span className="rounded-lg border border-green-100 bg-green-50 px-3 py-1 text-[11px] font-black tracking-tight text-green-600 shadow-sm">
              +{fmtCurrency(total)} saved (range total)
            </span>
          </div>
        </div>
      </div>

      <div className="relative min-h-[300px] w-full flex-1 px-3 pb-2 pt-5 sm:min-h-[340px] sm:px-5 sm:pb-3 sm:pt-6">
        {/* Ambient vignette */}
        <div className="pointer-events-none absolute inset-x-10 top-[18%] h-[55%] rounded-full bg-brand-500/[0.03] blur-[64px]" />
        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
          <ComposedChart
            data={data}
            margin={{ ...CHART_MARGIN, bottom: showBrush ? 28 : CHART_MARGIN.bottom }}
          >
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.45} />
                <stop offset="45%" stopColor="#3b82f6" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <filter
                id="lineGlow"
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur stdDeviation="2.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="4 12"
              vertical={false}
              stroke="#f3f4f6"
              strokeOpacity={0.85}
            />
            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              interval={Math.max(
                0,
                Math.floor((data.length - 1) / 6 || 1) - 1,
              )}
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
              tickFormatter={(v) => `$${v}`}
              width={54}
              domain={[0, (maxTop: number) => Math.ceil(maxTop * 1.12)]}
            />

            <Tooltip
              content={<CustomTooltip />}
              animationDuration={200}
              cursor={{
                fill: "#f9fafb",
                stroke: "#2563eb",
                strokeWidth: 1,
                strokeOpacity: 0.35,
                strokeDasharray: "4 4",
              }}
            />

            {avgRevenue != null && avgRevenue > 0 && (
              <ReferenceLine
                y={avgRevenue}
                stroke="#a78bfa"
                strokeDasharray="6 6"
                strokeWidth={1.5}
                label={{
                  position: "right",
                  value: "Avg",
                  fill: "#7c3aed",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="transparent"
              fill="url(#fillRevenue)"
              fillOpacity={1}
              isAnimationActive
              animationDuration={1200}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3.5}
              filter="url(#lineGlow)"
              dot={<Dot />}
              activeDot={{
                r: 9,
                fill: "#fff",
                stroke: "#2563eb",
                strokeWidth: 3,
              }}
              isAnimationActive
              animationDuration={1200}
            />

            {showBrush ? (
              <Brush
                dataKey="dateLabel"
                height={22}
                stroke="#93c5fd"
                travellerWidth={9}
                fill="#f8fafc"
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>

        {!data.length && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            No recovered revenue in this range — widen dates or reset filters.
          </p>
        )}
      </div>
    </div>
  );
}
