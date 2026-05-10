"use client";

interface Stats {
  at_risk_count?: number;
  high_risk_count?: number;
  revenue_at_risk?: number;
  revenue_recovered?: number;
  churn_reduction_percentage?: number;
  interventions_sent_today?: number;
  interventions_in_range?: number;
  filter_date_from?: string;
  filter_date_to?: string;
}

interface Props {
  stats: Stats | null;
  rangeLabel?: string;
}

export default function MetricCards({ stats, rangeLabel }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  const fmtCurrency = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${Math.round(n)}`;
  };

  const rangeSub =
    rangeLabel ||
    (stats?.filter_date_from && stats?.filter_date_to
      ? `${stats.filter_date_from} → ${stats.filter_date_to}`
      : "Selected range");

  const cards = [
    {
      label: "Revenue at risk",
      value: stats ? fmtCurrency(stats.revenue_at_risk ?? 0) : "—",
      sub: `${stats?.at_risk_count ?? 0} at-risk accounts`,
      trend: "+2.4%",
      trendUp: false,
      icon: (
        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bg: "bg-red-50",
    },
    {
      label: "Revenue recovered",
      value: stats ? fmtCurrency(stats.revenue_recovered ?? 0) : "—",
      sub: `Recovered · ${rangeSub}`,
      trend: "+$12.4k",
      trendUp: true,
      icon: (
        <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      bg: "bg-brand-50",
    },
    {
      label: "Churn reduction",
      value: stats?.churn_reduction_percentage != null ? `${stats.churn_reduction_percentage}%` : "—",
      sub: "Reduction in churn rate",
      trend: "+4.2%",
      trendUp: true,
      icon: (
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bg: "bg-green-50",
    },
    {
      label: "Model accuracy",
      value: "92%",
      sub: "RandomForest v1.2",
      trend: "+0.2%",
      trendUp: true,
      icon: (
        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="group dash-panel flex min-h-[148px] flex-col p-5 transition-shadow duration-200 hover:shadow-md sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div
              className={`rounded-xl p-2.5 ${card.bg} transition-transform duration-200 group-hover:scale-[1.02]`}
            >
              {card.icon}
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              {card.label}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                {card.value}
              </span>
              <span
                className={`text-[11px] font-bold ${
                  card.trendUp ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {card.trend}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] font-medium text-gray-500">
              {card.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
