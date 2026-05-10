export type InterventionSortBy = "sent_at" | "revenue_saved" | "playbook" | "outcome";

export interface DashboardFilters {
  date_from: string;
  date_to: string;
  /** Empty string = all retention services / playbooks */
  playbook: string;
  sort_by: InterventionSortBy;
  sort_dir: "asc" | "desc";
  /** Axis order for revenue chart daily buckets */
  chart_sort_days: "asc" | "desc";
}

export function defaultDashboardFilters(days = 30): DashboardFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    date_from: iso(start),
    date_to: iso(end),
    playbook: "",
    sort_by: "sent_at",
    sort_dir: "desc",
    chart_sort_days: "asc",
  };
}
