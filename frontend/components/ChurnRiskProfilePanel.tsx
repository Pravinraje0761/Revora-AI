"use client";

import React, { useCallback, useId, useState } from "react";

type ProfileSection = Record<string, string | number | boolean | null | undefined>;

export interface ChurnRiskProfile {
  usage_behavior?: ProfileSection;
  satisfaction?: ProfileSection;
  pricing_billing?: ProfileSection;
  support_interactions?: ProfileSection;
  product_quality?: ProfileSection;
  engagement?: ProfileSection;
  demographics?: ProfileSection;
  contract_subscription?: ProfileSection;
  competitor_influence?: ProfileSection;
  customer_lifetime_value?: ProfileSection;
  behavioral_warnings?: ProfileSection;
}

const SECTION_ORDER: { key: keyof ChurnRiskProfile; title: string }[] = [
  { key: "usage_behavior", title: "Usage behavior" },
  { key: "satisfaction", title: "Satisfaction" },
  { key: "pricing_billing", title: "Pricing & billing" },
  { key: "support_interactions", title: "Support" },
  { key: "product_quality", title: "Product quality" },
  { key: "engagement", title: "Engagement" },
  { key: "demographics", title: "Demographics" },
  { key: "contract_subscription", title: "Contract & subscription" },
  { key: "competitor_influence", title: "Competitor influence" },
  { key: "customer_lifetime_value", title: "Lifetime value" },
  { key: "behavioral_warnings", title: "Behavioral warnings" },
];

function formatLabel(k: string): string {
  return k
    .replace(/_pct/g, " %")
    .replace(/_usd/g, " ($)")
    .replace(/_/g, " ")
    .replace(/\b90d\b/g, "(90d)")
    .replace(/\b30d\b/g, "(30d)");
}

function formatValue(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number" && Number.isFinite(v)) {
    if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
    return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  return String(v);
}

function Chevron({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ChurnRiskProfilePanel({ profile }: { profile: ChurnRiskProfile | null | undefined }) {
  const panelId = useId();
  const [panelOpen, setPanelOpen] = useState(true);

  const togglePanel = useCallback(() => setPanelOpen((v) => !v), []);

  if (!profile || typeof profile !== "object") return null;

  const activeSections = SECTION_ORDER.filter(({ key }) => {
    const block = profile[key];
    return block && typeof block === "object" && Object.keys(block).length > 0;
  });

  return (
    <div
      className="mb-8 overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50/30 p-1 shadow-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 font-black text-white text-sm shadow-inner">
            {activeSections.length}
          </div>
          <div>
            <h3 className="text-[13px] font-black uppercase tracking-wider text-gray-900">
              Churn Signal Profile
            </h3>
            <p className="text-[11px] font-bold text-gray-500 opacity-80">
              {activeSections.length} factor areas · tap a row below to expand details
            </p>
          </div>
        </div>
        <button
          onClick={togglePanel}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
        >
          {panelOpen ? "Hide" : "Show"}
          <Chevron open={panelOpen} />
        </button>
      </div>

      {panelOpen && (
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_ORDER.map(({ key, title }) => {
            const block = profile[key];
            if (!block || typeof block !== "object" || Object.keys(block).length === 0) return null;

            return (
              <details key={key} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-emerald-200">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-700 group-open:text-emerald-700">
                    {title}
                  </span>
                  <Chevron open={false} className="group-open:rotate-180" />
                </summary>
                <div className="border-t border-gray-50 px-4 py-3">
                  <dl className="space-y-2">
                    {Object.entries(block).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                          {formatLabel(k)}
                        </dt>
                        <dd className="text-[11px] font-black tabular-nums text-gray-900">
                          {formatValue(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
