"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/supabase";
import StrategyOptimization from "./StrategyOptimization";
import ChurnRiskProfilePanel from "./ChurnRiskProfilePanel";

interface Customer {
  id: string;
  customer_id: string;
  churn_score: number;
  risk_tier: "high" | "medium" | "low";
  top_reasons: { description: string; weight: number; impact?: string }[];
  customers: {
    name: string;
    email: string;
    company: string;
    plan: string;
    mrr: number;
    days_since_login?: number;
    feature_usage_score?: number;
    churn_risk_profile?: Record<string, Record<string, unknown>>;
    sentiment_score?: number;
    product_usage_trend?: string;
    feature_requests_count?: number;
    support_history_summary?: string;
    mentioned_competitor?: string;
  };
}

interface Props {
  refreshKey: number;
  onIntervene: () => void;
}

const TIER_LABELS = {
  high: { label: "High", cls: "badge-high" },
  medium: { label: "Medium", cls: "badge-medium" },
  low: { label: "Low", cls: "badge-low" },
};

export default function CustomerTable({ refreshKey, onIntervene }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [intervening, setIntervening] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [mode, setMode] = useState<"Autonomous" | "Approval" | "Manual">("Approval");
  const [modeMessage, setModeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "Autonomous") {
      setModeMessage("Autonomous Agent Active: Scanning high-risk accounts...");
      const timer = setTimeout(() => setModeMessage(null), 3000);
      return () => clearTimeout(timer);
    } else if (mode === "Manual") {
      setModeMessage("Manual Mode: All AI actions require direct operator input.");
      const timer = setTimeout(() => setModeMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const loadSimulation = async (customerId: string) => {
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await fetch(`${API_URL}/interventions/simulate/${customerId}`);
      if (!res.ok) {
        throw new Error(`Simulation request failed with ${res.status}`);
      }
      const data = await res.json();
      setSimulationData(data);
    } catch (e) {
      console.error(e);
      setSimulationData(null);
      setSimError("Unable to load simulation data.");
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    if (expandedCustomerId) {
      loadSimulation(expandedCustomerId);
    } else {
      setSimulationData(null);
      setSimError(null);
    }
  }, [expandedCustomerId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url =
          filter === "all"
            ? `${API_URL}/customers/at-risk`
            : `${API_URL}/customers/at-risk?tier=${filter}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) {
          setCustomers(data);
        } else {
          console.error("At-risk customers data is not an array:", data);
          setCustomers([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter, refreshKey]);

  const handleIntervene = async (customerId: string, customerName: string, strategyId?: string) => {
    setIntervening(customerId);
    setLastResult(null);
    try {
      const url = strategyId 
        ? `${API_URL}/interventions/intervene/${customerId}?strategy_id=${strategyId}`
        : `${API_URL}/interventions/intervene/${customerId}`;
      
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      setLastResult({ name: customerName, ...data });
      onIntervene();
      if (expandedCustomerId === customerId) setExpandedCustomerId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIntervening(null);
    }
  };

  return (
    <div className="flex flex-col px-5 pb-6 pt-5 sm:px-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Tier filter:
          </p>
          <div className="flex flex-wrap gap-2">
            {(["all", "high", "medium", "low"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  filter === t
                    ? "bg-brand-600 text-white shadow-md shadow-brand-200"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Agent mode:
          </p>
          <div className="flex rounded-xl bg-gray-50 p-1 ring-1 ring-gray-100">
            {(["Autonomous", "Approval", "Manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                  mode === m
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {modeMessage && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-[11px] font-bold text-brand-700 ring-1 ring-brand-100">
            <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
            {modeMessage}
          </div>
        </div>
      )}

      {lastResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-sm">
          <p className="font-medium text-green-800">
            Email sent to {lastResult.name}
          </p>
          <p className="text-green-600 text-xs mt-0.5">
            Subject: {lastResult.email?.subject} · Playbook:{" "}
            {lastResult.playbook?.replace(/_/g, " ")}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          No at-risk customers found. Run scoring first.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Customer
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Risk
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Root Causes
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <React.Fragment key={c.id}>
                  <tr
                    className={`group transition-colors hover:bg-gray-50/50 ${
                      expandedCustomerId === c.customer_id ? "bg-gray-50/80" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[11px] font-black text-gray-400">
                          {c.customers?.name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-gray-900">
                            {c.customers?.name}
                          </p>
                          <p className="truncate text-[11px] font-medium text-gray-500">
                            {c.customers?.company} · {c.customers?.plan}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={TIER_LABELS[c.risk_tier].cls}>
                          {TIER_LABELS[c.risk_tier].label} Risk
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full ${
                                c.churn_score > 0.7
                                  ? "bg-red-500"
                                  : c.churn_score > 0.4
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${c.churn_score * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-gray-400">
                            {Math.round(c.churn_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.top_reasons?.slice(0, 2).map((r, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                              r.impact === 'Critical' 
                                ? 'bg-red-50 border-red-100 text-red-600' 
                                : r.impact === 'Significant'
                                  ? 'bg-amber-50 border-amber-100 text-amber-600'
                                  : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {r.impact && <span className="mr-1 font-bold">{r.impact}:</span>}
                            {r.description}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setExpandedCustomerId(
                              expandedCustomerId === c.customer_id ? null : c.customer_id,
                            )
                          }
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                            expandedCustomerId === c.customer_id
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                          }`}
                        >
                          {expandedCustomerId === c.customer_id ? "Close" : "Optimize"}
                        </button>
                        <button
                          onClick={() => handleIntervene(c.customer_id, c.customers?.name)}
                          disabled={!!intervening}
                          className="btn-primary !px-3 !py-1.5 !text-[11px]"
                        >
                          Intervene
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedCustomerId === c.customer_id && (
                    <tr>
                      <td colSpan={4} className="bg-gray-50/50 px-5 py-10">
                        <div className="mx-auto max-w-6xl">
                          <div className="flex flex-col gap-6">
                            <ChurnRiskProfilePanel
                              profile={c.customers.churn_risk_profile as any}
                            />
                            {simError && (
                              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {simError}
                              </div>
                            )}
                            <StrategyOptimization
                              customer={simulationData?.customer ?? c.customers}
                              simulationData={simulationData}
                              loading={simLoading}
                              onSelect={(strategyId) => handleIntervene(c.customer_id, c.customers?.name, strategyId)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
