"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/supabase";
import type { DashboardFilters, InterventionSortBy } from "@/lib/dashboardFilters";

interface Props {
  value: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
}

const fieldClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-brand-500/40 focus:ring-2 focus:ring-brand-500/20";

const labelClass =
  "mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400";

export default function DashboardFilters({ value, onChange }: Props) {
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [playbooks, setPlaybooks] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/interventions/playbook-options`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.service_prefixes)) setPrefixes(data.service_prefixes);
        if (Array.isArray(data?.playbooks)) setPlaybooks(data.playbooks);
      })
      .catch(() => {});
  }, []);

  const patch = (partial: Partial<DashboardFilters>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="dash-panel p-4 sm:p-5">
      <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
        Filters
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <label className={labelClass} htmlFor="df-from">
            From
          </label>
          <input
            id="df-from"
            type="date"
            value={value.date_from}
            onChange={(e) => patch({ date_from: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="df-to">
            To
          </label>
          <input
            id="df-to"
            type="date"
            value={value.date_to}
            onChange={(e) => patch({ date_to: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div className="lg:col-span-1 xl:col-span-2">
          <label className={labelClass} htmlFor="df-service">
            Retention service
          </label>
          <select
            id="df-service"
            value={value.playbook}
            onChange={(e) => patch({ playbook: e.target.value })}
            className={fieldClass}
          >
            <option value="">All services</option>
            <optgroup label="Templates (prefix)">
              {prefixes.map((p) => (
                <option key={`pfx-${p}`} value={p}>
                  {p}*
                </option>
              ))}
            </optgroup>
            <optgroup label="Exact playbooks">
              {playbooks.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="df-sort">
            Sort feed by
          </label>
          <select
            id="df-sort"
            value={value.sort_by}
            onChange={(e) =>
              patch({ sort_by: e.target.value as InterventionSortBy })
            }
            className={fieldClass}
          >
            <option value="sent_at">Date sent</option>
            <option value="revenue_saved">Revenue saved</option>
            <option value="playbook">Service</option>
            <option value="outcome">Outcome</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="df-order">
            Order
          </label>
          <select
            id="df-order"
            value={value.sort_dir}
            onChange={(e) =>
              patch({ sort_dir: e.target.value as "asc" | "desc" })
            }
            className={fieldClass}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="df-chart-order">
            Chart day order
          </label>
          <select
            id="df-chart-order"
            value={value.chart_sort_days}
            onChange={(e) =>
              patch({
                chart_sort_days: e.target.value as "asc" | "desc",
              })
            }
            className={fieldClass}
          >
            <option value="asc">Oldest → newest</option>
            <option value="desc">Newest → oldest</option>
          </select>
        </div>
      </div>
    </div>
  );
}
