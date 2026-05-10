from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Literal, Optional

from services.ai_service import (
    generate_retention_email,
    explain_root_causes,
    generate_strategy_rationale,
)
from services.email_service import send_retention_email
from services.strategy_service import (
    build_negotiation_brief,
    simulate_mass_interventions,
    select_autonomous_strategy,
    update_learning_loop,
)
from services.crm_service import update_crm_customer_status
from lib.mock_db import get_mock_db
from services.intervention_filters import (
    attach_customers,
    bucket_recovered_revenue_by_day,
    filter_interventions,
    resolve_range,
    sort_interventions,
)

router = APIRouter()

def get_db():
    return get_mock_db()


class InterventionQueryBody(BaseModel):
    """Filter and sort intervention rows for dashboards."""

    date_from: Optional[str] = None
    date_to: Optional[str] = None
    playbook: Optional[str] = Field(None, description="Retention service / playbook id or template prefix")
    sort_by: Literal["sent_at", "revenue_saved", "playbook", "outcome"] = "sent_at"
    sort_dir: Literal["asc", "desc"] = "desc"
    limit: int = Field(50, ge=1, le=500)


class RevenueSeriesBody(BaseModel):
    """Daily recovered revenue buckets inside an inclusive date range."""

    date_from: Optional[str] = None
    date_to: Optional[str] = None
    playbook: Optional[str] = None
    sort_days: Literal["asc", "desc"] = "asc"


@router.get("/playbook-options")
def list_playbook_options(db=Depends(get_db)):
    rows = db.table("interventions").select("playbook").execute().data
    values = sorted({r["playbook"] for r in rows if r.get("playbook")})
    templates = sorted(
        {
            r["playbook"].split("_", 1)[0]
            for r in rows
            if r.get("playbook") and "_" in str(r["playbook"])
        }
    )
    return {"playbooks": values, "service_prefixes": templates}


@router.post("/query")
def query_interventions(body: InterventionQueryBody, db=Depends(get_db)):
    """POST filter: date range + service/playbook + sort."""
    start, end = resolve_range(body.date_from, body.date_to, default_days=30)
    raw = db.table("interventions").select("*").execute().data
    filtered = filter_interventions(raw, start=start, end=end, playbook=body.playbook)
    rows = attach_customers(db, filtered)
    rows = sort_interventions(rows, body.sort_by, body.sort_dir)
    return rows[: body.limit]


@router.post("/revenue-series")
def revenue_series(body: RevenueSeriesBody, db=Depends(get_db)):
    """POST: recovered revenue by day for chart (respects range + playbook)."""
    start, end = resolve_range(body.date_from, body.date_to, default_days=30)
    raw = db.table("interventions").select("*").execute().data
    return bucket_recovered_revenue_by_day(
        raw,
        start=start,
        end=end,
        playbook=body.playbook,
        sort_days=body.sort_days,
    )

@router.get("/simulate/{customer_id}")
def get_simulations(customer_id: str, db=Depends(get_db)):
    # Get prediction data
    pred = db.table("churn_predictions").select("*").eq("customer_id", customer_id).execute().data
    if not pred:
        raise HTTPException(status_code=404, detail="No prediction found for this customer")
    
    # Get customer data
    cust = db.table("customers").select("*").eq("id", customer_id).execute().data
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Thousands of simulations happen here
    customer_with_score = {**cust[0], "churn_score": pred[0]["churn_score"]}
    sims = simulate_mass_interventions(customer_with_score, pred[0]["top_reasons"])
    explanation = explain_root_causes(customer_with_score, pred[0]["top_reasons"])
    best_strategy = select_autonomous_strategy(sims)
    
    # Add AI-generated rationale for each simulated strategy
    for s in sims:
        s["rationale"] = generate_strategy_rationale(cust[0], s, pred[0]["top_reasons"])
    
    return {
        "customer": customer_with_score,
        "simulations": sims,
        "best_strategy": best_strategy,
        "ai_explanation": explanation,
        "negotiation_brief": build_negotiation_brief(customer_with_score, best_strategy, pred[0]["top_reasons"]),
    }

@router.post("/intervene/{customer_id}")
def intervene(customer_id: str, strategy_id: str = None, db=Depends(get_db)):
    """
    Executes a retention intervention.
    """
    # 1. Get prediction & customer
    pred_data = db.table("churn_predictions").select("*").eq("customer_id", customer_id).execute().data
    if not pred_data:
        raise HTTPException(status_code=404, detail="Prediction not found")
    pred = pred_data[0]
    
    cust_data = db.table("customers").select("*").eq("id", customer_id).execute().data
    if not cust_data:
        raise HTTPException(status_code=404, detail="Customer not found")
    cust = cust_data[0]
    
    # 2. Decide playbook/strategy
    if not strategy_id:
        customer_with_score = {**cust, "churn_score": pred["churn_score"]}
        sims = simulate_mass_interventions(customer_with_score, pred["top_reasons"])
        best = select_autonomous_strategy(sims)
        strategy_id = best["strategy_id"]
        strategy_name = best["name"]
        template_id = best["template_id"]
    else:
        from services.strategy_service import STRATEGY_TEMPLATES
        template_id = strategy_id.split("_")[0]
        strategy_name = STRATEGY_TEMPLATES.get(template_id, {}).get("name", "Manual")

    # 3. AI generates email
    email_content = generate_retention_email(cust, template_id, pred["top_reasons"])

    # 4. Send email
    email_res = send_retention_email(
        to_email=cust["email"],
        to_name=cust["name"],
        subject=email_content["subject"],
        body=email_content["body"],
    )

    # 5. Log intervention & Update CRM
    intervention_data = {
        "customer_id": customer_id,
        "playbook": strategy_id,
        "email_subject": email_content["subject"],
        "outcome": "sent",
        "revenue_saved": 0, # initially 0 until success
    }
    db.table("interventions").insert(intervention_data).execute()
    
    crm_log = update_crm_customer_status(customer_id, "INTERVENTION_SENT", {
        "strategy_name": strategy_name,
        "revenue_saved": cust["mrr"]
    })

    return {
        "success": True,
        "playbook": strategy_id,
        "strategy_name": strategy_name,
        "email": email_content,
        "crm_status": crm_log["status"]
    }


@router.post("/outcome/{intervention_id}")
def mark_outcome(intervention_id: str, outcome: str = "recovered"):
    """Mark an intervention as recovered or lost. Updates revenue_saved."""
    db = get_db()

    row_result = (
        db.table("interventions")
        .select("*, customers(mrr)")
        .eq("id", intervention_id)
        .execute()
    )

    if not row_result.data:
        raise HTTPException(status_code=404, detail="Intervention not found")

    intervention = row_result.data[0]
    mrr = intervention.get("customers", {}).get("mrr", 0) if intervention.get("customers") else 0
    revenue_saved = round(mrr * 12 * 0.1, 2) if outcome == "recovered" else 0

    db.table("interventions").update({
        "outcome": outcome,
        "revenue_saved": revenue_saved,
    }).eq("id", intervention_id).execute()

    return {
        "status": "updated",
        "outcome": outcome,
        "revenue_saved": revenue_saved,
    }


@router.get("/")
def list_interventions(limit: int = 50):
    db = get_db()
    result = (
        db.table("interventions")
        .select("*, customers(name, email, plan, mrr, feature_usage_score, product_usage_trend)")
        .order("sent_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


@router.get("/revenue-by-day")
def revenue_by_day():
    """Returns daily revenue recovered for the last 30 days — for the chart."""
    db = get_db()
    raw = db.table("interventions").select("*").execute().data
    start, end = resolve_range(None, None, default_days=30)
    return bucket_recovered_revenue_by_day(raw, start=start, end=end, playbook=None, sort_days="asc")
