"use client";

import React, { useState } from "react";
import { API_URL } from "@/lib/supabase";

const SCENARIOS = [
  { id: "reduce_price_10", name: "Reduce Price by 10%", icon: "💰" },
  { id: "launch_feature", name: "Launch Top Feature", icon: "🚀" },
  { id: "improve_onboarding", name: "Improve Onboarding", icon: "✨" },
  { id: "expand_support", name: "Expand Support Coverage", icon: "🎧" },
  { id: "annual_contracts", name: "Shift to Annual Contracts", icon: "📅" },
  { id: "csm_expansion", name: "CSM Team Expansion", icon: "👥" },
  { id: "soc2_compliance", name: "SOC2/Security Compliance", icon: "🛡️" },
  { id: "referral_engine", name: "Referral Program", icon: "🔗" },
];

export default function BoardroomSimulator() {
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState<any>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const runSimulation = async (scenarioId: string) => {
    setLoading(true);
    setActiveScenario(scenarioId);
    try {
      const res = await fetch(`${API_URL}/predictions/boardroom-sim?scenario=${scenarioId}`);
      const data = await res.json();
      setImpact(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="dash-panel flex flex-col h-full bg-white ring-1 ring-gray-100 overflow-hidden">
      <div className="dash-panel-head items-center justify-between border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏛️</span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Boardroom Simulator
          </h2>
        </div>
        <span className="badge-high">Strategic</span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto scrollbar-hide">
        <p className="text-[11px] font-medium text-gray-500 mb-4 uppercase tracking-wider">
          Select a strategic scenario to project impact
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => runSimulation(s.id)}
              disabled={loading}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-2 ${
                activeScenario === s.id
                  ? "border-brand-500 bg-brand-50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-brand-200 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{s.icon}</span>
              <span className="text-[11px] font-bold text-gray-700">{s.name}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-gray-400 uppercase animate-pulse">
              Simulating thousands of account variations...
            </p>
          </div>
        ) : impact ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-700 uppercase mb-1">Revenue Protected</p>
                <p className="text-xl font-black text-emerald-900">{fmt(impact.revenue_protected)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[9px] font-black text-blue-700 uppercase mb-1">Churn Reduction</p>
                <p className="text-xl font-black text-blue-900">{impact.churn_reduction}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-[9px] font-black text-purple-700 uppercase mb-1">ROI Potential</p>
                <p className="text-xl font-black text-purple-900">{impact.roi}x</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[9px] font-black text-amber-700 uppercase mb-1">Payback Period</p>
                <p className="text-xl font-black text-amber-900">{impact.payback_period}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Strategic Rationale</h4>
              <p className="text-[12px] font-medium text-gray-600 leading-relaxed italic">
                "{impact.strategic_rationale}"
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 opacity-30 grayscale grayscale-0">
             <div className="text-4xl mb-4">📊</div>
             <p className="text-[11px] font-bold text-gray-400 uppercase">Projection Engine Ready</p>
          </div>
        )}
      </div>
    </div>
  );
}
