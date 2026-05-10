import logging
from apscheduler.schedulers.background import BackgroundScheduler
from lib.mock_db import get_mock_db
from datetime import datetime
import time

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def run_daily_scoring():
    """
    Scores all customers and writes predictions to Supabase.
    Runs automatically every 24 hours.
    """
    from models.churn_model import predict_batch, train_model

    logger.info("Revora AI: Daily churn scoring job starting...")

    supabase = get_mock_db()

    # 1. Get all customers
    customers = supabase.table("customers").select("*").execute().data
    if not customers:
        logger.warning("No customers to score.")
        return

    # 2. Score them
    predictions = predict_batch(customers)

    # 3. Save predictions
    supabase.table("churn_predictions").insert(predictions).execute()

    logger.info(f"Revora AI: Successfully scored {len(predictions)} customers.")


def run_autonomous_agent():
    """
    Continuous monitoring loop:
    1. Finds high-risk customers without recent interventions.
    2. Simulates optimal LTV strategies.
    3. Autonomously executes best strategy.
    """
    from lib.mock_db import get_mock_db
    from services.strategy_service import simulate_mass_interventions, select_autonomous_strategy
    from routers.interventions import intervene
    
    logger.info("Revora AI: Autonomous Agent cycle starting...")
    db = get_mock_db()
    
    # 1. Find customers with Churn Score > 0.8 and no intervention in last 7 days
    preds = db.table("churn_predictions").select("*").order("churn_score", desc=True).limit(5).execute().data
    
    for p in preds:
        if p["churn_score"] > 0.85:
            customer_id = p["customer_id"]
            
            # Check for recent intervention
            recent = db.table("interventions").select("*").eq("customer_id", customer_id).execute().data
            if recent:
                # Mock logic: skip if intervened today
                continue
                
            # 2. Simulate optimal strategy
            cust = db.table("customers").select("*").eq("id", customer_id).execute().data[0]
            customer_with_score = {**cust, "churn_score": p["churn_score"]}
            sims = simulate_mass_interventions(customer_with_score, p["top_reasons"])
            best = select_autonomous_strategy(sims)
            
            if best and best["actionable"]:
                logger.info(f"Revora AI: AUTONOMOUS ACTION for {cust['name']} using {best['name']}")
                # 3. Execute!
                intervene(customer_id, strategy_id=best["strategy_id"], db=db)
                
    logger.info("Revora AI: Autonomous Agent cycle complete.")


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(run_daily_scoring, "interval", hours=24)
        # Run autonomous agent every 1 minute for demo purposes (usually would be hourly)
        scheduler.add_job(run_autonomous_agent, "interval", minutes=1)
        scheduler.start()
        logger.info("Revora AI: Background scheduler started.")
