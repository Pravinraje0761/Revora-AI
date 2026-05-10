"use client";

import { useState, useEffect } from "react";
import MetricCards from "@/components/MetricCards";
import CustomerTable from "@/components/CustomerTable";
import InterventionFeed from "@/components/InterventionFeed";
import ExecutiveChat from "@/components/ExecutiveChat";
import RevenueChart from "@/components/RevenueChart";
import BoardroomSimulator from "@/components/BoardroomSimulator";
import ProductIntelligence from "@/components/ProductIntelligence";
import CompetitiveWarRoom from "@/components/CompetitiveWarRoom";
import ExpansionRadar from "@/components/ExpansionRadar";
import VoiceOfCustomer from "@/components/VoiceOfCustomer";
import DashboardFiltersPanel from "@/components/DashboardFilters";
import { API_URL } from "@/lib/supabase";
import { defaultDashboardFilters, type DashboardFilters } from "@/lib/dashboardFilters";

interface DashboardMetrics {
  at_risk_count?: number;
  high_risk_count?: number;
  revenue_at_risk?: number;
  revenue_recovered?: number;
  churn_reduction_percentage?: number;
  interventions_sent_today?: number;
  interventions_in_range?: number;
  filter_date_from?: string;
  filter_date_to?: string;
  expansion_opportunities?: any[];
  product_intelligence?: any[];
}

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<"operations" | "strategy">("operations");
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    defaultDashboardFilters(30),
  );
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/customers/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_from: filters.date_from,
        date_to: filters.date_to,
        playbook: filters.playbook || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => setMetrics(data));
  }, [refreshKey, filters.date_from, filters.date_to, filters.playbook]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-200/55 bg-white/95 backdrop-blur-md">
        <div className="dash-shell flex h-14 items-center justify-between gap-4 sm:h-[3.625rem]">
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
            <div className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 shadow-sm shadow-brand-900/15 sm:h-10 sm:w-10">
                <svg
                  className="h-[1.1rem] w-[1.1rem] text-white sm:h-[1.2rem] sm:w-[1.2rem]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="truncate text-[1.06rem] font-bold tracking-tight text-gray-900 sm:text-lg">
                Revora <span className="font-bold text-brand-600">AI</span>
              </span>
            </div>
            <p className="hidden min-w-0 truncate text-[11px] font-medium tracking-wide text-gray-500 md:block lg:max-w-md">
              <span className="text-emerald-600">Live</span>
              {" · "}RandomForest churn model
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="btn-ghost inline-flex items-center gap-2 !rounded-xl !py-2 !px-3 text-[12px]"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 sm:h-10 sm:w-10"
              aria-label="Account"
            >
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="dash-shell flex flex-col gap-6 pt-6 sm:gap-8 sm:pt-8 lg:gap-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {view === "operations" ? "Revenue recovery" : "Strategic intelligence"}
            </h1>
            <p className="mt-0.5 max-w-lg text-[13px] text-gray-500">
              {view === "operations" 
                ? "At-risk MRR, interventions, recovered revenue — one workspace."
                : "Scenario testing, roadmap prioritization, and market intelligence."}
            </p>
          </div>

          <div className="flex shrink-0 rounded-xl bg-gray-100 p-1 ring-1 ring-gray-200">
            <button
              onClick={() => setView("operations")}
              className={`rounded-lg px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all ${
                view === "operations" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Operations
            </button>
            <button
              onClick={() => setView("strategy")}
              className={`rounded-lg px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all ${
                view === "strategy" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Strategy
            </button>
          </div>
        </div>

        <DashboardFiltersPanel value={filters} onChange={setFilters} />

        <div className="lg:col-span-12">
          <MetricCards stats={metrics} />
        </div>

        {view === "operations" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <div className="h-[400px]">
                <RevenueChart refreshKey={refreshKey} filters={filters} />
              </div>
              <div className="dash-panel flex flex-col">
                <div className="dash-panel-head items-center justify-between gap-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    At-risk pipeline
                  </h3>
                  <span className="badge-high shrink-0">Priority</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                  <CustomerTable
                    refreshKey={refreshKey}
                    onIntervene={() => setRefreshKey((k) => k + 1)}
                  />
                </div>
              </div>
            </div>

            <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4 lg:sticky lg:top-24 lg:self-start lg:gap-6">
              <ExecutiveChat />
              <InterventionFeed refreshKey={refreshKey} filters={filters} />
            </aside>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[500px]">
                  <BoardroomSimulator />
                </div>
                <div className="h-[500px]">
                  <ProductIntelligence />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[500px]">
                  <CompetitiveWarRoom />
                </div>
                <div className="h-[500px]">
                  <VoiceOfCustomer />
                </div>
              </div>
            </div>

            <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4 lg:sticky lg:top-24 lg:self-start lg:gap-6">
              <ExecutiveChat />
              <ExpansionRadar />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
