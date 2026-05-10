"use client";

import React from "react";

interface Simulation {
  strategy_id: string;
  name: string;
  description: string;
  cost_percent: number;
  prob: number;
  expected_ltv: number;
  roi: number;
  actionable: boolean;
  rationale?: string;
}

interface Props {
  simulationData: {
    simulations: Simulation[];
    best_strategy: Simulation;
    ai_explanation: string;
    negotiation_brief?: {
      sentiment_label?: string;
      sentiment_score?: number;
      usage_trend?: string;
      feature_requests_open?: number;
      support_history_summary?: string;
      renewal_risk?: string;
      months_to_renewal?: number | null;
      target_competitor?: string;
      competitor_pricing?: string;
      competitor_feature_gap?: string;
      recommended_response?: string;
    };
    customer?: {
      sentiment_score?: number;
      product_usage_trend?: string;
      feature_requests_count?: number;
      support_history_summary?: string;
      mentioned_competitor?: string;
      competitor_pricing?: string;
      competitor_feature_gap?: string;
    };
  } | null;
  loading: boolean;
  customer?: any;
  onSelect: (strategyId: string) => void;
}

export default function StrategyOptimization({ simulationData, loading, customer, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">AI Simulating Optimal Strategies...</p>
      </div>
    );
  }

  if (!simulationData || !Array.isArray(simulationData.simulations)) return null;

  const {
    simulations,
    best_strategy: bestStrategy,
    ai_explanation: aiExplanation,
    negotiation_brief: negotiationBrief,
  } = simulationData;
  const panelCustomer = simulationData.customer ?? customer ?? {};
  const sentimentScore = Number(panelCustomer.sentiment_score ?? negotiationBrief?.sentiment_score ?? 0);
  const usageTrend = String(
    negotiationBrief?.usage_trend ?? panelCustomer.product_usage_trend ?? "stable",
  ).toLowerCase();
  const sentimentLabel =
    negotiationBrief?.sentiment_label ??
    (sentimentScore > 0.3 ? "Positive" : sentimentScore < -0.3 ? "Critical" : "Neutral");
  const featureRequests =
    negotiationBrief?.feature_requests_open ?? panelCustomer.feature_requests_count ?? 0;
  const supportSummary =
    negotiationBrief?.support_history_summary ?? panelCustomer.support_history_summary ?? "Stable";
  const renewalRisk = negotiationBrief?.renewal_risk ?? "High";
  const competitor =
    negotiationBrief?.target_competitor ?? panelCustomer.mentioned_competitor ?? "None detected";
  const competitorPricing =
    negotiationBrief?.competitor_pricing ?? panelCustomer.competitor_pricing ?? "Pricing parity not confirmed";
  const competitorFeatureGap =
    negotiationBrief?.competitor_feature_gap ??
    panelCustomer.competitor_feature_gap ??
    "No major gap recorded";
  const recommendedResponse =
    negotiationBrief?.recommended_response ??
    `Position ${bestStrategy?.name ?? "the selected strategy"} around the top churn drivers and measurable ROI.`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Insight Engines */}
      <div className="lg:col-span-4 space-y-6">
        {/* Negotiation Engine Panel */}
        {customer && (
          <div className="bg-[#1A1F2B] rounded-[2rem] p-6 text-white shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-200/60">AI Negotiation Engine</h4>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500 font-black mb-1.5">Sentiment</p>
                  <p className={`text-xs font-black ${sentimentScore > 0.3 ? 'text-green-400' : sentimentScore < -0.3 ? 'text-red-400' : 'text-amber-400'}`}>
                    {sentimentLabel}
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500 font-black mb-1.5">Usage Trend</p>
                  <p className={`text-xs font-black ${usageTrend === 'up' ? 'text-green-400' : usageTrend === 'down' ? 'text-red-400' : 'text-blue-400'}`}>
                    {usageTrend.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5">
                <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500 font-black mb-4">Leverage Analysis</p>
                <ul className="space-y-3.5">
                  <li className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-medium">Feature Requests</span>
                    <span className="font-black">{featureRequests} Open</span>
                  </li>
                  <li className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-medium">Support History</span>
                    <span className="font-black text-right ml-4 truncate max-w-[140px] text-gray-200">{supportSummary}</span>
                  </li>
                  <li className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-medium">Renewal Risk</span>
                    <span className={`font-black ${renewalRisk === "Critical" ? "text-red-400" : renewalRisk === "High" ? "text-orange-300" : "text-amber-300"}`}>{renewalRisk}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Competitive Comparator Panel */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <h4 className="text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.15em]">Competitive Offer Comparator</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Target Competitor</span>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">{competitor}</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-[10px] font-black mt-0.5">✕</span>
                <p className="text-[11px] font-medium text-gray-600"><span className="font-black text-gray-900">Pricing Gap:</span> {competitorPricing}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-[10px] font-black mt-0.5">✕</span>
                <p className="text-[11px] font-medium text-gray-600"><span className="font-black text-gray-900">Feature Gap:</span> {competitorFeatureGap}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-[10px] font-black mt-0.5">✓</span>
                <p className="text-[11px] font-medium text-gray-600"><span className="font-black text-gray-900">Revora AI edge:</span> Autonomous Revenue Recovery</p>
              </div>
            </div>

            <div className="bg-[#0D2E27] rounded-2xl p-5 text-white shadow-lg">
              <p className="text-[9px] uppercase tracking-widest text-emerald-200/40 font-black mb-3">Recommended Response Strategy</p>
              <p className="text-[11px] font-bold leading-relaxed text-emerald-50">
                {recommendedResponse}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">AI Root Cause Engine</h4>
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed italic font-medium">
            "{aiExplanation || "Detecting systemic engagement drop in the last 14 days..."}"
          </p>
        </div>
      </div>

      {/* Right Column: Simulation Frontier */}
      <div className="lg:col-span-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-wider">Simulation Frontier (Top 5 / 1,000+)</h4>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sorted by Expected LTV</span>
        </div>
        
        <div className="space-y-4">
          {simulations.slice(0, 5).map((sim) => {
            const isBest = sim.strategy_id === bestStrategy?.strategy_id;
            return (
              <div 
                key={sim.strategy_id}
                className={`group p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer hover:shadow-xl ${
                  isBest 
                    ? "bg-emerald-50/20 border-emerald-500/30 ring-4 ring-emerald-500/5 shadow-emerald-500/10" 
                    : "bg-white border-gray-50 hover:border-emerald-200"
                }`}
                onClick={() => onSelect(sim.strategy_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-105 ${
                      isBest ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-gray-50 text-gray-400"
                    }`}>
                      {Math.round(sim.prob * 100)}%
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-[15px] font-black text-gray-900">{sim.name}</p>
                        {isBest && (
                          <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Optimal</span>
                        )}
                      </div>
                      <p className="text-[12px] font-medium text-gray-400 truncate max-w-[320px]">{sim.description}</p>
                      {sim.rationale && (
                        <p className="mt-2 text-[10px] text-emerald-600 font-bold italic leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                          "AI Insight: {sim.rationale}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900 tracking-tight">${sim.expected_ltv.toLocaleString()}</p>
                    <p className={`text-[11px] font-black uppercase tracking-widest ${isBest ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {sim.roi >= 0 ? '+' : ''}{sim.roi}x ROI
                    </p>
                  </div>
                </div>
                
                {/* Visual Probability Bar */}
                <div className="mt-5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${isBest ? "bg-emerald-500" : "bg-gray-300"}`}
                    style={{ width: `${sim.prob * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
