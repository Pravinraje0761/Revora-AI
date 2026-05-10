"""
Run this once to populate your Supabase database with 200 realistic customers
and 7 days of fake intervention history for the demo.

Usage: python data/seed.py
"""

import os
import sys
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from faker import Faker
from supabase import create_client

load_dotenv()

fake = Faker()
random.seed(42)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

PLANS = [
    ("Starter", 29),
    ("Starter", 29),
    ("Growth", 99),
    ("Growth", 99),
    ("Growth", 99),
    ("Pro", 299),
    ("Pro", 299),
    ("Enterprise", 499),
]

DEMO_CUSTOMERS = [
    {
        "name": "Priya Sharma",
        "email": "priya@acmecorp.com",
        "company": "Acme Corp",
        "plan": "Pro",
        "mrr": 299,
        "days_since_login": 21,
        "feature_usage_score": 12,
        "support_tickets_last30d": 4,
        "plan_age_days": 45,
    },
    {
        "name": "Marcus Johnson",
        "email": "marcus@techflow.io",
        "company": "TechFlow",
        "plan": "Growth",
        "mrr": 99,
        "days_since_login": 18,
        "feature_usage_score": 8,
        "support_tickets_last30d": 3,
        "plan_age_days": 22,
    },
    {
        "name": "Sarah Chen",
        "email": "sarah@launchpad.co",
        "company": "LaunchPad",
        "plan": "Enterprise",
        "mrr": 499,
        "days_since_login": 16,
        "feature_usage_score": 19,
        "support_tickets_last30d": 5,
        "plan_age_days": 60,
    },
    {
        "name": "Ravi Patel",
        "email": "ravi@buildfast.dev",
        "company": "BuildFast",
        "plan": "Starter",
        "mrr": 29,
        "days_since_login": 25,
        "feature_usage_score": 5,
        "support_tickets_last30d": 2,
        "plan_age_days": 10,
    },
    {
        "name": "Elena Torres",
        "email": "elena@novascale.com",
        "company": "NovaScale",
        "plan": "Pro",
        "mrr": 299,
        "days_since_login": 12,
        "feature_usage_score": 35,
        "support_tickets_last30d": 1,
        "plan_age_days": 90,
    },
]


def make_customer(is_risky: bool = False, is_healthy: bool = False):
    plan_name, mrr = random.choice(PLANS)

    if is_risky:
        days_since_login = random.randint(14, 45)
        feature_usage_score = random.uniform(2, 28)
        support_tickets = random.randint(2, 6)
        plan_age_days = random.randint(7, 40)
    elif is_healthy:
        days_since_login = random.randint(0, 5)
        feature_usage_score = random.uniform(65, 100)
        support_tickets = random.randint(0, 1)
        plan_age_days = random.randint(90, 730)
    else:
        days_since_login = random.randint(1, 30)
        feature_usage_score = random.uniform(10, 90)
        support_tickets = random.randint(0, 4)
        plan_age_days = random.randint(7, 500)

    return {
        "name": fake.name(),
        "email": fake.unique.company_email(),
        "company": fake.company(),
        "plan": plan_name,
        "mrr": mrr,
        "days_since_login": days_since_login,
        "feature_usage_score": round(feature_usage_score, 1),
        "support_tickets_last30d": support_tickets,
        "plan_age_days": plan_age_days,
    }


def seed_customers(supabase):
    print("Seeding customers...")

    customers = DEMO_CUSTOMERS.copy()

    for _ in range(30):
        customers.append(make_customer(is_risky=True))
    for _ in range(80):
        customers.append(make_customer(is_healthy=True))
    for _ in range(85):
        customers.append(make_customer())

    result = supabase.table("customers").insert(customers).execute()
    inserted = result.data
    print(f"  Inserted {len(inserted)} customers")
    return inserted


def seed_interventions(supabase, customers):
    print("Seeding 7 days of intervention history...")

    playbooks = ["high_risk_discount", "medium_risk_feature_tip", "low_risk_upsell"]
    subjects = [
        "We miss you — here's 20% off your next month",
        "3 features you haven't tried yet",
        "You're a power user — here's what's next",
        "Quick check-in from our team",
        "Your account health score needs attention",
    ]

    interventions = []
    for day_offset in range(7, 0, -1):
        sent_date = datetime.now() - timedelta(days=day_offset)
        daily_count = random.randint(4, 10)
        sample = random.sample(customers, min(daily_count, len(customers)))

        for c in sample:
            recovered = random.random() < 0.40
            playbook = random.choice(playbooks)
            mrr = c.get("mrr", 99)

            interventions.append({
                "customer_id": c["id"],
                "playbook": playbook,
                "email_subject": random.choice(subjects),
                "email_body": f"Hi {c['name'].split()[0]}, we noticed your engagement has dropped...",
                "sent_at": sent_date.isoformat(),
                "outcome": "recovered" if recovered else "pending",
                "revenue_saved": round(mrr * 12 * 0.1, 2) if recovered else 0,
            })

    supabase.table("interventions").insert(interventions).execute()
    print(f"  Inserted {len(interventions)} historical interventions")


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_URL and SUPABASE_KEY in your .env file")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Revora AI — Database Seeder")
    print("=" * 40)

    inserted_customers = seed_customers(supabase)
    seed_interventions(supabase, inserted_customers)

    print("=" * 40)
    print("Done! Your database is ready for the demo.")
    print(f"  Total customers: {len(inserted_customers)}")
    print("  Demo customers: Priya, Marcus, Sarah, Ravi, Elena (high-risk)")


if __name__ == "__main__":
    main()
