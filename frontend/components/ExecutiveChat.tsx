"use client";

import { useState } from "react";
import { API_URL } from "@/lib/supabase";
import NlMessage from "@/components/NlMessage";

type Role = "user" | "ai";

interface ChatMessage {
  role: Role;
  content: string;
}

const STARTER_PROMPTS = [
  "What strategic decision will have the greatest impact on revenue?",
  "Which feature should we build next to save the most revenue?",
  "Which competitor is gaining traction?",
  "Strategic summary of recovery efforts",
];

export default function ExecutiveChat() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSource, setLastSource] = useState<string | null>(null);

  const handleSend = async (e?: React.FormEvent, text?: string) => {
    e?.preventDefault();
    const userMsg = (text ?? query).trim();
    if (!userMsg || loading) return;

    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const historyPayload = messages.slice(-14).map((m) => ({
      role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg, history: historyPayload }),
      });
      const data = await res.json();
      const answer =
        typeof data.response === "string"
          ? data.response
          : "Advisor returned an unexpected response.";
      setLastSource(typeof data.source === "string" ? data.source : null);
      setMessages((prev) => [...prev, { role: "ai", content: answer }]);
    } catch {
      setLastSource(null);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "**Unavailable**\n\nConfirm the API URL and that the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const pill =
    lastSource === "openai"
      ? "border-emerald-200/90 bg-emerald-50 text-emerald-800"
      : lastSource === "demo"
        ? "border-amber-200/90 bg-amber-50 text-amber-900"
        : "border-gray-200 bg-gray-50 text-gray-600";

  const pillLabel =
    lastSource === "openai" ? "Cloud" : lastSource === "demo" ? "Demo" : "Ready";

  return (
    <div className="dash-panel flex min-h-[360px] flex-1 flex-col overflow-hidden">
      <div className="dash-panel-head items-start justify-between gap-3 sm:items-center">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600 text-[9px] font-black text-white">
            NLM
          </span>
          <div className="min-w-0">
            <h2 className="text-[11px] font-bold tracking-tight text-gray-900 sm:text-xs">
              Executive advisor
            </h2>
            <p className="text-[10px] text-gray-500">
              Grounded in live dashboard metrics
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${pill}`}
        >
          {pillLabel}
        </span>
      </div>

      <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Suggested queries
            </p>
            <div className="flex flex-col gap-2">
              {STARTER_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(undefined, q)}
                  className="w-full text-left rounded-xl border border-gray-100 bg-white px-4 py-3 text-[12px] font-medium text-gray-700 transition-all hover:border-brand-500/30 hover:bg-brand-50/50 hover:text-brand-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand-600 text-white shadow-sm shadow-brand-900/10"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <NlMessage content={m.content} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-100 px-4 py-3 text-[13px] text-gray-500">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask advisor anything..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-4 pr-12 text-[13px] text-gray-900 outline-none transition-all focus:border-brand-500/40 focus:ring-2 focus:ring-brand-500/10"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
