"""Shared helpers for date-range and playbook filtering (used by POST analytics endpoints)."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Callable, Optional


def parse_iso_day(value: Optional[str]) -> Optional[date]:
    if not value or not isinstance(value, str):
        return None
    return datetime.strptime(value.strip()[:10], "%Y-%m-%d").date()


def default_date_range(days: int = 30) -> tuple[date, date]:
    end = date.today()
    start = end - timedelta(days=days - 1)
    return start, end


def resolve_range(
    date_from: Optional[str],
    date_to: Optional[str],
    *,
    default_days: int = 30,
) -> tuple[date, date]:
    start = parse_iso_day(date_from)
    end = parse_iso_day(date_to)
    if start is None or end is None:
        start, end = default_date_range(default_days)
    if end < start:
        start, end = end, start
    return start, end


def intervention_day(row: dict) -> Optional[date]:
    sent_at = row.get("sent_at")
    if not sent_at or not isinstance(sent_at, str):
        return None
    return parse_iso_day(sent_at)


def in_closed_range(d: Optional[date], start: date, end: date) -> bool:
    if d is None:
        return False
    return start <= d <= end


def playbook_matches(row_playbook: Optional[str], filter_playbook: Optional[str]) -> bool:
    """Exact match, or strategy ids like discount_0.12 match template prefix discount."""
    if not filter_playbook or not filter_playbook.strip():
        return True
    rp = (row_playbook or "").strip()
    fp = filter_playbook.strip()
    if rp == fp:
        return True
    if "_" in rp:
        prefix = rp.split("_", 1)[0]
        if fp == prefix:
            return True
    return rp.startswith(fp + "_")


def attach_customers(db: Any, rows: list[dict]) -> list[dict]:
    cust_rows = db.table("customers").select("*").execute().data
    by_id = {c["id"]: c for c in cust_rows}
    keys = ["name", "email", "plan", "mrr", "feature_usage_score", "product_usage_trend"]
    out = []
    for r in rows:
        row = dict(r)
        cid = row.get("customer_id")
        c = by_id.get(cid)
        if c:
            row["customers"] = {k: c.get(k) for k in keys}
        else:
            row["customers"] = {}
        out.append(row)
    return out


def sort_interventions(rows: list[dict], sort_by: str, sort_dir: str) -> list[dict]:
    reverse = sort_dir.lower() == "desc"
    key_map: dict[str, Callable[[dict], Any]] = {
        "sent_at": lambda r: r.get("sent_at") or "",
        "revenue_saved": lambda r: float(r.get("revenue_saved") or 0),
        "playbook": lambda r: (r.get("playbook") or "").lower(),
        "outcome": lambda r: (r.get("outcome") or "").lower(),
    }
    fn = key_map.get(sort_by, key_map["sent_at"])
    return sorted(rows, key=fn, reverse=reverse)


def filter_interventions(
    rows: list[dict],
    *,
    start: date,
    end: date,
    playbook: Optional[str],
) -> list[dict]:
    filtered = []
    for r in rows:
        d = intervention_day(r)
        if not in_closed_range(d, start, end):
            continue
        if not playbook_matches(r.get("playbook"), playbook):
            continue
        filtered.append(r)
    return filtered


def bucket_recovered_revenue_by_day(
    rows: list[dict],
    *,
    start: date,
    end: date,
    playbook: Optional[str],
    sort_days: str = "asc",
) -> list[dict]:
    """One bucket per calendar day in [start, end]; recovered outcomes only."""
    delta_days = (end - start).days
    days: dict[str, float] = {}
    for i in range(delta_days + 1):
        d = (start + timedelta(days=i)).isoformat()
        days[d] = 0.0

    for r in rows:
        if r.get("outcome") != "recovered":
            continue
        if not playbook_matches(r.get("playbook"), playbook):
            continue
        d = intervention_day(r)
        if not d or not in_closed_range(d, start, end):
            continue
        key = d.isoformat()
        if key in days:
            days[key] += float(r.get("revenue_saved") or 0)

    ordered = sorted(days.items(), key=lambda x: x[0], reverse=(sort_days.lower() == "desc"))
    return [{"date": d, "revenue": round(v, 2)} for d, v in ordered]
