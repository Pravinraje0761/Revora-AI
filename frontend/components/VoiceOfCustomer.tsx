"use client";

import React from "react";

const THEMES = [
  { theme: "Integration Friction", risk: "$450k", mentions: 124, trend: "up", color: "red" },
  { theme: "Onboarding Speed", risk: "$120k", mentions: 85, trend: "stable", color: "amber" },
  { theme: "Reporting ROI", risk: "$85k", mentions: 42, trend: "up", color: "blue" },
];

export default function VoiceOfCustomer() {
  return (
    <div className="dash-panel flex flex-col h-full bg-white ring-1 ring-gray-100 overflow-hidden">
      <div className="dash-panel-head items-center justify-between border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Voice-of-Customer Intel
          </h2>
        </div>
        <span className="badge-medium">Sentiment</span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto scrollbar-hide">
        <p className="text-[11px] font-medium text-gray-500 mb-5 uppercase tracking-wider">
          Recurring themes from support & calls
        </p>

        <div className="space-y-4">
          {THEMES.map((t) => (
            <div key={t.theme} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 bg-white">
              <div className={`w-2 h-10 rounded-full bg-${t.color}-500`} />
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-black text-gray-900 truncate">{t.theme}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {t.mentions} Mentions
                  </span>
                  <span className={`text-[10px] font-black uppercase ${
                    t.trend === 'up' ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {t.trend === 'up' ? '↑ Rising' : '→ Stable'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-black text-red-600">{t.risk}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Strategic Risk</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
           <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3">Recent Critical Quote</h4>
           <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-brand-500 italic">
             <p className="text-[12px] text-gray-600 leading-relaxed">
               "We love the automation, but without a deep Salesforce sync, my team has to double-enter data. It's becoming a dealbreaker for our renewal."
             </p>
             <p className="mt-2 text-[10px] font-black text-gray-400 uppercase">— CTO, Global Corp 7</p>
           </div>
        </div>
      </div>
    </div>
  );
}
