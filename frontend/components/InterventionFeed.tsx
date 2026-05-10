"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/supabase";
import type { DashboardFilters } from "@/lib/dashboardFilters";

interface Intervention {
  id: string;
  playbook?: string;
  email_subject: string;
  outcome: string;
  revenue_saved: number;
  sent_at: string;
  customers: {
    name: string;
    plan: string;
    mrr: number;
    feature_usage_score: number;
    product_usage_trend: string;
  };
}

const PLAYBOOK_LABELS: Record<string, { label: string; color: string }> = {
  high_risk_discount: { label: "Discount offer", color: "text-red-500" },
  medium_risk_feature_tip: { label: "Feature tip", color: "text-amber-500" },
  low_risk_upsell: { label: "Upsell", color: "text-green-500" },
  discount: { label: "Price adjustment", color: "text-red-500" },
  feature_education: { label: "Value realization", color: "text-amber-500" },
  direct_outreach: { label: "Human in the loop", color: "text-blue-500" },
  community_invite: { label: "Network engagement", color: "text-purple-500" },
  contract_renegotiation: { label: "Strategic negotiation", color: "text-indigo-500" },
  competitive_counter: { label: "Competitive counter", color: "text-emerald-500" },
  expansion_upsell: { label: "Expansion opportunity", color: "text-green-500" },
};

interface Props {
  refreshKey: number;
  filters: DashboardFilters;
}

export default function InterventionFeed({ refreshKey, filters }: Props) {
  const [items, setItems] = useState<Intervention[]>([]);

  const normalizePlaybook = (playbook?: string) => {
    if (!playbook) return "";
    return playbook.replace(/_\d+(\.\d+)?$/, "");
  };

  const readablePlaybook = (playbook?: string) => {
    const normalized = normalizePlaybook(playbook);
    if (PLAYBOOK_LABELS[normalized]?.label) return PLAYBOOK_LABELS[normalized].label;
    return normalized
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/interventions/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date_from: filters.date_from,
            date_to: filters.date_to,
            playbook: filters.playbook || null,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            limit: 40,
          }),
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.error("Intervention feed data is not an array:", data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [
    refreshKey,
    filters.date_from,
    filters.date_to,
    filters.playbook,
    filters.sort_by,
    filters.sort_dir,
  ]);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="dash-panel flex min-h-[320px] flex-1 flex-col overflow-hidden">
      <div className="dash-panel-head items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Activity
        </h2>
      </div>

      <div className="scrollbar-hide flex max-h-[min(480px,50vh)] min-h-[240px] flex-1 flex-col gap-1 overflow-y-auto px-3 py-3 sm:px-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 ${
              i === 0 ? "bg-brand-50/25" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-black text-gray-400">
                {item.customers?.name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[12px] font-bold text-gray-900">
                    {item.customers?.name}
                  </p>
                  <span className="shrink-0 text-[10px] font-medium text-gray-400">
                    {timeAgo(item.sent_at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500">
                  {item.playbook ? readablePlaybook(item.playbook) : "Outreach"} · {item.email_subject}
                </p>
                
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[9px] text-gray-400 mb-1">
                      <span>Feature Engagement</span>
                      <span className="font-bold text-gray-600">{item.customers?.feature_usage_score}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          item.customers?.feature_usage_score > 70 ? 'bg-green-500' : 
                          item.customers?.feature_usage_score > 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.customers?.feature_usage_score}%` }} 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-[9px] text-gray-400 uppercase font-bold">Trend</span>
                    <span className={`text-[10px] font-black ${
                      item.customers?.product_usage_trend === 'up'
                        ? 'text-green-600'
                        : item.customers?.product_usage_trend === 'down'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }`}>
                      {item.customers?.product_usage_trend === 'up'
                        ? '↑ UP'
                        : item.customers?.product_usage_trend === 'down'
                          ? '↓ DOWN'
                          : '→ STABLE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
