"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/supabase";

interface ProductGap {
  gap: string;
  revenue_impact: number;
  churn_driver_rank: number;
  description: string;
  impact_area: string;
  effort_score: string;
  projected_churn_reduction: string;
}

export default function ProductIntelligence() {
  const [gaps, setGaps] = useState<ProductGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/customers/stats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (Array.isArray(data.product_intelligence)) {
          setGaps(data.product_intelligence);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (n: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="dash-panel flex flex-col h-full bg-white ring-1 ring-gray-100 overflow-hidden">
      <div className="dash-panel-head items-center justify-between border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏗️</span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Product investment engine
          </h2>
        </div>
        <span className="badge-medium">Roadmap</span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto scrollbar-hide">
        <p className="text-[11px] font-medium text-gray-500 mb-5 uppercase tracking-wider">
          Roadmap prioritization based on MRR protection
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {gaps.map((gap, i) => (
              <div 
                key={gap.gap}
                className={`p-4 rounded-xl border transition-all ${
                  i === 0 ? "border-brand-200 bg-brand-50/30" : "border-gray-50 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-black text-gray-900 truncate">
                      {gap.gap}
                    </h3>
                    <p className="text-[10px] font-bold text-brand-600 uppercase mt-0.5">
                      Rank #{gap.churn_driver_rank} Driver · {gap.impact_area}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-black text-emerald-600">
                      {fmt(gap.revenue_impact)}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Annual Impact</p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  {gap.description}
                </p>

                <div className="flex items-center gap-4 pt-3 border-t border-gray-100/50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Projected Lift</span>
                    <span className="text-[11px] font-bold text-gray-700">-{gap.projected_churn_reduction} Churn</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Effort</span>
                    <span className="text-[11px] font-bold text-gray-700">{gap.effort_score}</span>
                  </div>
                  <button className="ml-auto text-[10px] font-black text-brand-600 uppercase hover:underline">
                    View Data →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
