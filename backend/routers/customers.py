from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date

from lib.mock_db import get_mock_db
from services.intervention_filters import (
    filter_interventions,
    playbook_matches,
    resolve_range,
)

router = APIRouter()


def get_db():
    return get_mock_db()


class StatsFilterBody(BaseModel):
    """POST body to scope intervention-derived metrics by date range and playbook."""

    date_from: Optional[str] = None
    date_to: Optional[str] = None
    playbook: Optional[str] = None


class ExpansionPitchRequest(BaseModel):
    customer_id: str
    expansion_type: str
    reason: str


@router.post("/expansion-pitch")
def post_expansion_pitch(req: ExpansionPitchRequest):
    """Generates an AI pitch for expansion."""
    from services.ai_service import generate_expansion_pitch
    db = get_db()
    
    customer = db.table("customers").eq("id", req.customer_id).execute().data
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    pitch = generate_expansion_pitch(customer[0], req.expansion_type, req.reason)
    return {"pitch": pitch}


class CustomerCreate(BaseModel):
    name: str
    email: str
    company: Optional[str] = None
    plan: str
    mrr: float
    days_since_login: int = 0
    feature_usage_score: float = 50.0
    support_tickets_last30d: int = 0
    plan_age_days: int = 1


@router.get("/")
def list_customers(limit: int = 200):
    db = get_db()
    result = db.table("customers").select("*").limit(limit).execute()
    return result.data


@router.get("/at-risk")
def get_at_risk_customers(tier: Optional[str] = None):
    """Returns customers with their latest churn prediction joined."""
    db = get_db()

    query = db.table("churn_predictions").select(
        "*, customers(*)"
    ).order("churn_score", desc=True)

    if tier:
        query = query.eq("risk_tier", tier)

    result = query.limit(100).execute()

    seen = set()
    unique = []
    for row in result.data:
        cid = row.get("customer_id")
        if cid not in seen:
            seen.add(cid)
            unique.append(row)

    return unique


@router.get("/stats")
def get_customer_stats():
    """Dashboard summary stats."""
    db = get_db()

    preds = db.table("churn_predictions").select("risk_tier, customers(mrr)").execute()

    high_risk_customers = [p for p in preds.data if p.get("risk_tier") == "high"]
    medium_risk_customers = [p for p in preds.data if p.get("risk_tier") == "medium"]

    revenue_at_risk = 0
    for p in high_risk_customers + medium_risk_customers:
        cust = p.get("customers")
        if isinstance(cust, dict):
            revenue_at_risk += cust.get("mrr", 0)
        else:
            # Fallback search
            cid = p.get("customer_id")
            for c in db.table("customers").data:
                if c["id"] == cid:
                    revenue_at_risk += c.get("mrr", 0)
                    break

    interventions = db.table("interventions").select("outcome, revenue_saved, sent_at").execute()
    total_recovered = sum(
        i.get("revenue_saved", 0) for i in interventions.data if i.get("outcome") == "recovered"
    )
    
    today_str = __import__("datetime").date.today().isoformat()
    sent_today = 0
    for i in interventions.data:
        sent_at = i.get("sent_at")
        if sent_at and isinstance(sent_at, str) and sent_at[:10] == today_str:
            sent_today += 1

    # Add Expansion and Product Intelligence for the dashboard
    from services.strategy_service import detect_expansion_opportunities, get_product_intelligence
    expansion_ops = detect_expansion_opportunities(db.table("customers").data)
    product_intel = get_product_intelligence(db.table("customers").data)

    # Calculate churn reduction percentage
    # In a real scenario, this would compare churn before and after RetainIQ
    # Here we can derive it from the success rate of interventions
    recovered_count = sum(1 for i in interventions.data if i.get("outcome") == "recovered")
    total_interventions = len(interventions.data)
    churn_reduction = (recovered_count / total_interventions * 100) if total_interventions > 0 else 0

    return {
        "at_risk_count": len(high_risk_customers) + len(medium_risk_customers),
        "high_risk_count": len(high_risk_customers),
        "medium_risk_count": len(medium_risk_customers),
        "revenue_at_risk": round(revenue_at_risk, 2),
        "revenue_recovered": round(total_recovered, 2),
        "churn_reduction_percentage": round(churn_reduction, 1),
        "interventions_sent_today": sent_today,
        "expansion_opportunities": expansion_ops,
        "product_intelligence": product_intel
    }


@router.post("/stats")
def post_customer_stats(body: StatsFilterBody):
    """Same dashboard metrics as GET /stats, but intervention KPIs respect date range + playbook."""
    db = get_db()
    start, end = resolve_range(body.date_from, body.date_to, default_days=30)

    preds = db.table("churn_predictions").select("risk_tier, customers(mrr)").execute()

    high_risk_customers = [p for p in preds.data if p.get("risk_tier") == "high"]
    medium_risk_customers = [p for p in preds.data if p.get("risk_tier") == "medium"]

    revenue_at_risk = 0
    for p in high_risk_customers + medium_risk_customers:
        cust = p.get("customers")
        if isinstance(cust, dict):
            revenue_at_risk += cust.get("mrr", 0)
        else:
            cid = p.get("customer_id")
            for c in db.table("customers").data:
                if c["id"] == cid:
                    revenue_at_risk += c.get("mrr", 0)
                    break

    interventions = db.table("interventions").select("outcome, revenue_saved, sent_at, playbook").execute().data
    filtered = filter_interventions(interventions, start=start, end=end, playbook=body.playbook)

    total_recovered = sum(
        i.get("revenue_saved", 0) for i in filtered if i.get("outcome") == "recovered"
    )

    # Calculate churn reduction percentage for the filtered set
    recovered_count = sum(1 for i in filtered if i.get("outcome") == "recovered")
    total_interventions = len(filtered)
    churn_reduction = (recovered_count / total_interventions * 100) if total_interventions > 0 else 0

    today_str = date.today().isoformat()
    sent_today = 0
    for i in interventions:
        sent_at = i.get("sent_at")
        if not sent_at or not isinstance(sent_at, str) or sent_at[:10] != today_str:
            continue
        if not playbook_matches(i.get("playbook"), body.playbook):
            continue
        sent_today += 1

    from services.strategy_service import detect_expansion_opportunities, get_product_intelligence

    expansion_ops = detect_expansion_opportunities(db.table("customers").data)
    product_intel = get_product_intelligence(db.table("customers").data)

    return {
        "at_risk_count": len(high_risk_customers) + len(medium_risk_customers),
        "high_risk_count": len(high_risk_customers),
        "medium_risk_count": len(medium_risk_customers),
        "revenue_at_risk": round(revenue_at_risk, 2),
        "revenue_recovered": round(total_recovered, 2),
        "churn_reduction_percentage": round(churn_reduction, 1),
        "interventions_sent_today": sent_today,
        "interventions_in_range": total_interventions,
        "filter_date_from": start.strftime("%b %d, %Y"),
        "filter_date_to": end.strftime("%b %d, %Y"),
        "expansion_opportunities": expansion_ops,
        "product_intelligence": product_intel,
    }


@router.post("/")
def create_customer(customer: CustomerCreate):
    db = get_db()
    result = db.table("customers").insert(customer.dict()).execute()
    return result.data[0]
