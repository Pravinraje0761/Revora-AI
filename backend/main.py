from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import customers, predictions, interventions
from services.scheduler import start_scheduler

load_dotenv()

from pydantic import BaseModel, Field
from typing import List, Literal

from services.ai_service import executive_nlm_chat
from models.churn_model import load_metrics
from lib.churn_risk_profile import condense_profile_for_llm

app = FastAPI(
    title="Revora AI API",
    description="Autonomous churn prediction and revenue recovery agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    query: str
    history: List[ChatHistoryMessage] = Field(default_factory=list)


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    from routers.customers import get_customer_stats
    from lib.mock_db import get_mock_db
    
    db = get_mock_db()
    stats = get_customer_stats()

    preview_rows = (
        db.table("churn_predictions")
        .select("*, customers(*)")
        .order("churn_score", desc=True)
        .limit(8)
        .execute().data
    )
    top_at_risk_preview: list[dict] = []
    for r in preview_rows:
        cust = r.get("customers") if isinstance(r.get("customers"), dict) else {}
        cid = r.get("customer_id")
        score = float(r.get("churn_score") or 0)
        profile = cust.get("churn_risk_profile")
        top_at_risk_preview.append(
            {
                "customer_id": cid,
                "name": cust.get("name") or "?",
                "company": cust.get("company") or "?",
                "plan": cust.get("plan") or "?",
                "mrr_usd": cust.get("mrr"),
                "risk_tier": r.get("risk_tier"),
                "churn_score_pct": round(score * 100, 1),
                "churn_signal_bullets": condense_profile_for_llm(profile if isinstance(profile, dict) else None),
            }
        )
    
    # Get top risk customer name for context
    top_pred = db.table("churn_predictions").select("churn_score, customers(name)").order("churn_score", desc=True).limit(1).execute()
    top_risk = top_pred.data[0] if top_pred.data else {}
    top_cust_name = top_risk.get("customers", {}).get("name", "N/A") if isinstance(top_risk.get("customers"), dict) else "N/A"

    context = {
        **stats,
        # Measured on the held-out split at training time; None until a model is trained.
        "accuracy": (load_metrics() or {}).get("accuracy"),
        "top_risk_customer": top_cust_name,
        "top_risk_score": round(top_risk.get("churn_score", 0) * 100, 1),
        "total_customers": len(db.table("customers").data),
        "interventions_in_range": stats.get("interventions_sent_today", 0), # Default to today if range not specified
        "top_at_risk_preview": top_at_risk_preview,
    }
    
    hist = [{"role": m.role, "content": m.content} for m in request.history[-24:]]
    reply, src = executive_nlm_chat(request.query.strip(), context, hist)
    return {"response": reply, "source": src}

app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
app.include_router(interventions.router, prefix="/interventions", tags=["interventions"])


@app.on_event("startup")
async def startup_event():
    start_scheduler()


@app.get("/")
def root():
    return {"status": "Revora AI API running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
