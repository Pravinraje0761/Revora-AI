"use client";

import React from "react";

const COMPETITORS = [
  { name: "ChurnZero", traction: "High", gap: "Native Salesforce Sync", risk: "Critical", score: 85 },
  { name: "Vitally", traction: "Medium", gap: "Advanced Analytics", risk: "Moderate", score: 62 },
  { name: "Gainsight", traction: "Stable", gap: "AI Automation", risk: "Low", score: 45 },
];

export default function CompetitiveWarRoom() {
  return (
    <div className="dash-panel flex flex-col h-full bg-white ring-1 ring-gray-100 overflow-hidden">
      <div className="dash-panel-head items-center justify-between border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Competitive War Room
          </h2>
        </div>
        <span className="badge-high">Risk Alert</span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto scrollbar-hide">
        <p className="text-[11px] font-medium text-gray-500 mb-5 uppercase tracking-wider">
          Market pressure & perceived feature gaps
        </p>

        <div className="flex flex-col gap-4">
          {COMPETITORS.map((c) => (
            <div key={c.name} className="p-4 rounded-xl border border-gray-50 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-[10px] font-black">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-gray-900">{c.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Traction: {c.traction}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                  c.risk === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {c.risk} Risk
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                    <span>Competitive Threat Score</span>
                    <span>{c.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        c.score > 80 ? 'bg-red-500' : c.score > 50 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100/50">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Primary Defection Driver</p>
                  <p className="text-[11px] font-bold text-gray-700 italic">"{c.gap}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-brand-600 rounded-xl shadow-lg shadow-brand-200">
           <h4 className="text-[10px] font-black text-white/70 uppercase mb-2">AI Strategic Response</h4>
           <p className="text-[12px] font-bold text-white leading-relaxed">
             "Prioritize 'Native Salesforce Sync' to neutralize ChurnZero's current momentum in our Enterprise segment."
           </p>
        </div>
      </div>
    </div>
  );
}
