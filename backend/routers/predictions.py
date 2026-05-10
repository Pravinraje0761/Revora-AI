import os
from fastapi import APIRouter, HTTPException
from supabase import create_client

from lib.mock_db import get_mock_db

router = APIRouter()


def get_db():
    return get_mock_db()


@router.post("/train")
def train_model_endpoint():
    """Train (or retrain) the churn model on all customer data."""
    from models.churn_model import train_model

    db = get_db()
    result = db.table("customers").select("*").execute()
    customers = result.data

    if len(customers) < 20:
        raise HTTPException(
            status_code=400,
            detail="Need at least 20 customers to train. Run seed.py first."
        )

    metrics = train_model(customers)
    return {"status": "trained", "metrics": metrics}


@router.post("/score-all")
def score_all_customers():
    """Score every customer and write predictions to DB. Use for demo 'Run Now' button."""
    from models.churn_model import predict_batch, train_model
    import os

    db = get_db()
    result = db.table("customers").select("*").execute()
    customers = result.data

    model_path = os.path.join(os.path.dirname(__file__), "../models/churn_model.pkl")
    if not os.path.exists(model_path):
        train_model(customers)

    predictions = predict_batch(customers)

    rows = [
        {
            "customer_id": p["customer_id"],
            "churn_score": p["churn_score"],
            "risk_tier": p["risk_tier"],
            "top_reasons": p["top_reasons"],
        }
        for p in predictions
    ]

    db.table("churn_predictions").insert(rows).execute()

    return {
        "status": "scored",
        "total": len(predictions),
        "high_risk": sum(1 for p in predictions if p["risk_tier"] == "high"),
        "medium_risk": sum(1 for p in predictions if p["risk_tier"] == "medium"),
        "low_risk": sum(1 for p in predictions if p["risk_tier"] == "low"),
    }


@router.post("/score/{customer_id}")
def score_single_customer(customer_id: str):
    """Score one customer and return their prediction with explanation."""
    from models.churn_model import predict_single

    db = get_db()
    result = db.table("customers").select("*").eq("id", customer_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer = result.data[0]

    try:
        prediction = predict_single(customer)
    except FileNotFoundError:
        raise HTTPException(
            status_code=400,
            detail="Model not trained yet. POST /predictions/train first."
        )

    row = {
        "customer_id": customer_id,
        "churn_score": prediction["churn_score"],
        "risk_tier": prediction["risk_tier"],
        "top_reasons": prediction["top_reasons"],
    }
    db.table("churn_predictions").insert(row).execute()

    return {**prediction, "customer": customer}


@router.get("/boardroom-sim")
def get_boardroom_sim(scenario: str):
    """Boardroom Simulator: Test strategic scenarios."""
    from services.strategy_service import simulate_boardroom_scenario
    
    db = get_db()
    customers = db.table("customers").select("*").execute().data
    
    # We need predictions to know who is at risk
    preds = db.table("churn_predictions").select("customer_id, churn_score").execute().data
    pred_map = {p["customer_id"]: p["churn_score"] for p in preds}
    
    # Attach score to customer for the simulator
    for c in customers:
        c["churn_score"] = pred_map.get(c["id"], 0.1)
        
    impact = simulate_boardroom_scenario(customers, scenario)
    return impact
