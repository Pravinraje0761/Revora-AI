"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/supabase";

interface ExpansionOp {
  customer_id: string;
  name: string;
  company: string;
  type: string;
  potential_mrr_lift: number;
  confidence: number;
  reason: string;
}

export default function ExpansionRadar() {
  const [ops, setOps] = useState<ExpansionOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [pitchingId, setPitchingId] = useState<string | null>(null);
  const [generatedPitch, setGeneratedPitch] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/customers/stats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (Array.isArray(data.expansion_opportunities)) {
          setOps(data.expansion_opportunities);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const generatePitch = async (op: ExpansionOp) => {
    setPitchingId(op.customer_id);
    setGeneratedPitch(null);
    try {
      const res = await fetch(`${API_URL}/customers/expansion-pitch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: op.customer_id,
          expansion_type: op.type,
          reason: op.reason,
        }),
      });
      const data = await res.json();
      setGeneratedPitch({ id: op.customer_id, text: data.pitch });
    } catch (e) {
      console.error(e);
    } finally {
      setPitchingId(null);
    }
  };

  const fmt = (n: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="dash-panel flex flex-col h-[500px] bg-white ring-1 ring-gray-100 overflow-hidden">
      <div className="dash-panel-head items-center justify-between border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Expansion Radar
          </h2>
        </div>
        <span className="badge-low">Growth Engine</span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto scrollbar-hide">
        <p className="text-[11px] font-medium text-gray-500 mb-5 uppercase tracking-wider">
          Identifying accounts with high upgrade velocity
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-gray-400 uppercase animate-pulse">Scanning user behavior...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {ops.map((op) => (
              <div key={op.customer_id} className="group p-4 rounded-xl border border-gray-50 bg-white hover:border-brand-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-black text-gray-900 truncate">{op.name}</h3>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{op.company}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-black text-brand-600">+{fmt(op.potential_mrr_lift)}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Monthly Lift</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-wider">
                      {op.type}
                    </span>
                    <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000"
                        style={{ width: `${op.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase">
                      {Math.round(op.confidence * 100)}% Conf.
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      <span className="font-bold text-gray-400 uppercase text-[9px] block mb-1">AI Detection Signal:</span>
                      "{op.reason}"
                    </p>
                  </div>

                  {generatedPitch?.id === op.customer_id && (
                    <div className="p-3 bg-brand-50 rounded-lg border border-brand-100 animate-in fade-in zoom-in duration-300">
                      <p className="text-[9px] font-black text-brand-600 uppercase mb-2">Generated Pitch</p>
                      <p className="text-[11px] text-gray-700 leading-relaxed italic">
                        "{generatedPitch.text}"
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPitch.text);
                            alert("Pitch copied to clipboard!");
                          }}
                          className="text-[9px] font-black text-brand-600 uppercase hover:underline"
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => generatePitch(op)}
                    disabled={pitchingId === op.customer_id}
                    className="w-full py-2 rounded-lg bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {pitchingId === op.customer_id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Draft Expansion Pitch"
                    )}
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
