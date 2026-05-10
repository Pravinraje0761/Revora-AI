import random
import numpy as np
from typing import Dict, List, Any

# Strategy base templates
STRATEGY_TEMPLATES = {
    "discount": {
        "name": "Price Adjustment",
        "description": "Dynamic discounting based on price sensitivity.",
        "cost_range": (0.05, 0.40), # 5% to 40%
        "success_rate_base": 0.3,
    },
    "feature_education": {
        "name": "Value Realization",
        "description": "Targeted education on high-value features.",
        "cost_range": (0.01, 0.05),
        "success_rate_base": 0.5,
    },
    "direct_outreach": {
        "name": "Human-in-the-loop",
        "description": "Success Manager intervention for high-value accounts.",
        "cost_range": (0.10, 0.20),
        "success_rate_base": 0.7,
    },
    "community_invite": {
        "name": "Network Engagement",
        "description": "Invite to exclusive webinars/community groups.",
        "cost_range": (0.0, 0.02),
        "success_rate_base": 0.2,
    },
    "contract_renegotiation": {
        "name": "AI Strategic Negotiation",
        "description": "Dynamic multi-factor renewal & pricing strategy.",
        "cost_range": (0.10, 0.30),
        "success_rate_base": 0.4,
    },
    "competitive_counter": {
        "name": "Competitive Counter-Offer",
        "description": "AI-generated comparison & specialized retention offer.",
        "cost_range": (0.05, 0.15),
        "success_rate_base": 0.55,
    },
    "expansion_upsell": {
        "name": "Expansion Opportunity",
        "description": "Identify high-usage users for upsell to Pro/Enterprise.",
        "cost_range": (0.0, 0.05),
        "success_rate_base": 0.35,
    }
}

def detect_expansion_opportunities(customers):
    """
    Expansion Opportunity Detection
    Identifies candidates for upsells, cross-sells, etc.
    """
    opportunities = []
    for c in customers:
        # High engagement and upward trend
        if c.get("feature_usage_score", 0) > 80 and c.get("product_usage_trend") == "up":
            opportunities.append({
                "customer_id": c["id"],
                "name": c["name"],
                "company": c.get("company", "Unknown"),
                "type": "Enterprise Upgrade" if c["plan"] == "Pro" else "Plan Upsell",
                "potential_mrr_lift": c["mrr"] * 0.4,
                "confidence": 0.85,
                "reason": "Top 5% feature engagement with positive usage velocity."
            })
        # Medium engagement but high MRR and stable
        elif c.get("feature_usage_score", 0) > 60 and c["mrr"] > 500 and c.get("product_usage_trend") == "stable":
            opportunities.append({
                "customer_id": c["id"],
                "name": c["name"],
                "company": c.get("company", "Unknown"),
                "type": "Add-on: Advanced Analytics",
                "potential_mrr_lift": c["mrr"] * 0.15,
                "confidence": 0.70,
                "reason": "Stable high-value account ready for advanced feature adoption."
            })
    return opportunities

def get_product_intelligence(customers):
    """
    Product Gap Intelligence & Investment Recommendation Engine
    """
    # In a real app, this would analyze churn reasons and feature requests from the DB
    gaps = [
        {
            "gap": "Native Salesforce Sync", 
            "revenue_impact": 1240000, 
            "churn_driver_rank": 1,
            "description": "Enterprise customers require seamless CRM integration for data consistency.",
            "impact_area": "Retention",
            "effort_score": "High",
            "projected_churn_reduction": "15%"
        },
        {
            "gap": "Advanced RBAC & Security Audit", 
            "revenue_impact": 890000, 
            "churn_driver_rank": 2,
            "description": "Compliance-heavy accounts need granular permission control for security audits.",
            "impact_area": "Security",
            "effort_score": "Medium",
            "projected_churn_reduction": "8%"
        },
        {
            "gap": "Public API v2 & Webhooks", 
            "revenue_impact": 620000, 
            "churn_driver_rank": 4,
            "description": "Developer-centric accounts are limited by current rate limits and endpoints.",
            "impact_area": "Scalability",
            "effort_score": "High",
            "projected_churn_reduction": "5%"
        },
        {
            "gap": "Mobile App Offline Mode", 
            "revenue_impact": 450000, 
            "churn_driver_rank": 3,
            "description": "Field teams lose productivity without offline capabilities in low-signal areas.",
            "impact_area": "Productivity",
            "effort_score": "Medium",
            "projected_churn_reduction": "12%"
        }
    ]
    return gaps

def simulate_boardroom_scenario(customers: list[dict], scenario: str) -> dict:
    """
    Boardroom Simulator: Estimates impact of strategic decisions.
    """
    total_mrr = sum(c.get("mrr", 0) for c in customers)
    at_risk_customers = [c for c in customers if c.get("churn_score", 0) > 0.6]
    at_risk_mrr = sum(c.get("mrr", 0) for c in at_risk_customers)
    
    impact = {
        "revenue_protected": 0,
        "churn_reduction": "0%",
        "upsell_impact": 0,
        "roi": 0,
        "payback_period": "0 months",
        "strategic_rationale": ""
    }
    
    if scenario == "reduce_price_10":
        # Reducing price reduces churn but lowers MRR immediately
        reduction = 0.10
        impact["revenue_protected"] = at_risk_mrr * 0.4 # Protect 40% of at-risk
        impact["churn_reduction"] = "25%"
        impact["upsell_impact"] = -total_mrr * reduction # Direct hit to top line
        impact["roi"] = 1.2
        impact["payback_period"] = "14 months"
        impact["strategic_rationale"] = "Trading immediate margin for long-term logo retention. Best for highly competitive segments."
        
    elif scenario == "launch_feature":
        # Launching a high-demand feature (like Salesforce Sync)
        impact["revenue_protected"] = at_risk_mrr * 0.35
        impact["churn_reduction"] = "18%"
        impact["upsell_impact"] = total_mrr * 0.05 # 5% upsell potential
        impact["roi"] = 4.5
        impact["payback_period"] = "6 months"
        impact["strategic_rationale"] = "Addresses core product gaps. High initial dev cost but massive compounding ROI through expansion."
        
    elif scenario == "improve_onboarding":
        impact["revenue_protected"] = at_risk_mrr * 0.20
        impact["churn_reduction"] = "12%"
        impact["upsell_impact"] = total_mrr * 0.02
        impact["roi"] = 3.0
        impact["payback_period"] = "4 months"
        impact["strategic_rationale"] = "Reduces early-stage abandonment. Essential for 'Starter' and 'Growth' tier health."
        
    elif scenario == "expand_support":
        impact["revenue_protected"] = at_risk_mrr * 0.15
        impact["churn_reduction"] = "10%"
        impact["upsell_impact"] = total_mrr * 0.01
        impact["roi"] = 2.1
        impact["payback_period"] = "8 months"
        impact["strategic_rationale"] = "Builds brand equity and trust. Critical for maintaining Enterprise SLAs."

    elif scenario == "annual_contracts":
        # Shift to annual: Higher retention, but 10-15% discount impact on MRR
        impact["revenue_protected"] = at_risk_mrr * 0.50
        impact["churn_reduction"] = "40%"
        impact["upsell_impact"] = -total_mrr * 0.12 
        impact["roi"] = 3.5
        impact["payback_period"] = "18 months"
        impact["strategic_rationale"] = "Locks in logos for 12 months. Short-term MRR dip is offset by massive increase in LTV and predictable cash flow."

    elif scenario == "csm_expansion":
        # Hiring more CSMs: High cost (ROI lower), but very high protection for high-value accounts
        impact["revenue_protected"] = at_risk_mrr * 0.45
        impact["churn_reduction"] = "30%"
        impact["upsell_impact"] = total_mrr * 0.08
        impact["roi"] = 1.8
        impact["payback_period"] = "12 months"
        impact["strategic_rationale"] = "High-touch engagement for top 20% of accounts. Best for protecting large enterprise contracts."

    elif scenario == "soc2_compliance":
        # Compliance: Unlocks enterprise, protects high-value data-sensitive accounts
        impact["revenue_protected"] = at_risk_mrr * 0.25
        impact["churn_reduction"] = "15%"
        impact["upsell_impact"] = total_mrr * 0.15
        impact["roi"] = 5.2
        impact["payback_period"] = "9 months"
        impact["strategic_rationale"] = "Essential for moving up-market. Protects against 'security audit' churn and enables 20% higher contract values."

    elif scenario == "referral_engine":
        # Referral program: Low cost, high growth impact
        impact["revenue_protected"] = at_risk_mrr * 0.05
        impact["churn_reduction"] = "5%"
        impact["upsell_impact"] = total_mrr * 0.10
        impact["roi"] = 8.0
        impact["payback_period"] = "3 months"
        impact["strategic_rationale"] = "Leverages happy power-users for growth. Extremely high ROI due to low customer acquisition cost."
        
    return impact

# Mock learned weights (in real life these would be in DB and updated via learning loop)
LEARNED_WEIGHTS = {
    "feature_education": 1.2,
    "discount": 0.9,
    "direct_outreach": 1.0,
    "community_invite": 1.1,
    "contract_renegotiation": 1.0,
    "competitive_counter": 1.1,
    "expansion_upsell": 1.0
}

def simulate_mass_interventions(customer: dict, churn_reasons: list, n_simulations: int = 1000) -> List[Dict[str, Any]]:
    """
    Simulates thousands of intervention variations to find the global optimum for LTV.
    """
    sims = []
    
    # Calculate base LTV (simplified: MRR * months_remaining_expected)
    # Average retention for this plan might be 24 months
    expected_lifetime_months = 24
    mrr = customer.get("mrr", 0)
    
    # Baseline: If we do nothing, what's the expected LTV?
    # We use the feature_usage_score and usage_trend as a proxy for baseline retention
    churn_score = 0.5 # Default middle ground
    if customer.get("churn_score"):
        churn_score = customer["churn_score"]
    elif customer.get("feature_usage_score"):
        # Lower usage = higher churn baseline
        churn_score = (100 - customer["feature_usage_score"]) / 100
        if customer.get("product_usage_trend") == "down":
            churn_score = min(0.95, churn_score * 1.5)

    baseline_prob = 1.0 - churn_score
    baseline_ltv = (mrr * expected_lifetime_months) * baseline_prob

    for _ in range(n_simulations):
        # Pick a random template
        template_id = random.choice(list(STRATEGY_TEMPLATES.keys()))
        template = STRATEGY_TEMPLATES[template_id]
        
        # Pick a random cost (e.g. specific discount %)
        cost = random.uniform(template["cost_range"][0], template["cost_range"][1])
        
        # Calculate success probability with learned weights and root causes
        prob = template["success_rate_base"] * LEARNED_WEIGHTS.get(template_id, 1.0)
        
        # Adjust for root causes
        for reason in churn_reasons:
            desc = reason.get("description", "").lower()
            if "feature" in desc and template_id == "feature_education":
                prob *= 1.3
            if "login" in desc and template_id == "direct_outreach":
                prob *= 1.2
            if "mrr" in desc and template_id == "discount":
                prob *= 1.4

        # Negotiation Engine Adjustments
        sentiment = customer.get("sentiment_score", 0)
        usage_trend = customer.get("product_usage_trend", "stable")
        feature_reqs = customer.get("feature_requests_count", 0)
        
        if template_id == "contract_renegotiation":
            if sentiment < -0.3: prob *= 0.8
            if usage_trend == "down": prob *= 0.7
            if feature_reqs > 2: prob *= 1.5
            if customer.get("last_pricing_discussion"): prob *= 1.2

        if template_id == "competitive_counter":
            if customer.get("mentioned_competitor"):
                prob *= 1.4
            if sentiment < -0.2:
                prob *= 0.9
            if "cheaper" in (customer.get("customer_feedback_snippet") or "").lower():
                prob *= 1.3

        prob = min(prob, 0.98)
        
        # Optimization Target: Maximized Post-Intervention LTV
        # potential_new_ltv is what we get if the intervention succeeds
        potential_new_ltv = (mrr * (1 - cost)) * expected_lifetime_months
        
        # expected_ltv is weighted by probability of success
        # We assume if the intervention fails, we get the baseline_ltv (or 0 if very high risk)
        expected_ltv = (potential_new_ltv * prob) + (baseline_ltv * (1 - prob) * 0.5)
        
        # Calculate ROI of the specific intervention cost
        # total_cost_dollars is the MRR we give up
        total_cost_dollars = mrr * cost * expected_lifetime_months
        
        # Lift is the improvement over baseline
        lift = expected_ltv - baseline_ltv
        roi = lift / (total_cost_dollars + 1)

        sims.append({
            "strategy_id": f"{template_id}_{round(cost, 2)}",
            "template_id": template_id,
            "name": f"{template['name']} ({int(cost*100)}%)",
            "description": template["description"],
            "cost_percent": round(cost, 2),
            "prob": round(prob, 3),
            "expected_ltv": round(expected_ltv, 2),
            "roi": round(roi, 2),
            "actionable": prob > 0.4 and roi > 0.5 # Relaxed but still sane
        })
        
    # Diversity Filter: Find the BEST variation for EACH template
    # Instead of just taking the absolute top 10 (which might all be 1 template)
    best_by_template = {}
    for s in sims:
        tid = s["template_id"]
        if tid not in best_by_template or s["expected_ltv"] > best_by_template[tid]["expected_ltv"]:
            best_by_template[tid] = s
            
    # Convert to list and sort by LTV
    diverse_top_sims = list(best_by_template.values())
    diverse_top_sims.sort(key=lambda x: x["expected_ltv"], reverse=True)
    
    return diverse_top_sims[:5] # Return top 5 distinct strategic directions

def select_autonomous_strategy(sims: list) -> Dict[str, Any]:
    """
    Selects the strategy that maximizes long-term LTV while meeting ROI thresholds.
    Assumes sims is already sorted by expected_ltv descending.
    """
    if not sims:
        return None
    
    # Policy: First priority is the highest LTV strategy that is also marked actionable
    for s in sims:
        if s.get("actionable"):
            return s
            
    # Fallback: If none are "perfectly" actionable, take the top LTV one anyway
    # but ensure it has at least some positive ROI
    for s in sims:
        if s.get("roi", 0) > 0:
            return s

    return sims[0]


def build_negotiation_brief(
    customer: dict,
    best_strategy: Dict[str, Any] | None,
    churn_reasons: list[dict] | None,
) -> Dict[str, Any]:
    """Build structured negotiation guidance for the dashboard side panel."""
    churn_reasons = churn_reasons or []
    churn_score = float(customer.get("churn_score") or 0)
    sentiment_score = float(customer.get("sentiment_score") or 0)
    usage_trend = (customer.get("product_usage_trend") or "stable").lower()
    feature_requests = int(customer.get("feature_requests_count") or 0)
    support_summary = customer.get("support_history_summary") or "Stable"
    competitor = customer.get("mentioned_competitor") or "None detected"
    competitor_pricing = customer.get("competitor_pricing") or "Pricing parity not confirmed"
    competitor_gap = customer.get("competitor_feature_gap") or "No major gap recorded"
    months_to_renewal = customer.get("churn_risk_profile", {}).get("contract_subscription", {}).get("months_to_renewal")

    if sentiment_score > 0.3:
        sentiment_label = "Positive"
    elif sentiment_score < -0.3:
        sentiment_label = "Critical"
    else:
        sentiment_label = "Neutral"

    if churn_score >= 0.85:
        renewal_risk = "Critical"
    elif churn_score >= 0.65:
        renewal_risk = "High"
    elif churn_score >= 0.4:
        renewal_risk = "Moderate"
    else:
        renewal_risk = "Watch"

    strongest_driver = churn_reasons[0]["description"] if churn_reasons else "general disengagement"
    strategy_name = best_strategy.get("name") if best_strategy else "Human review"

    if best_strategy and best_strategy.get("template_id") == "competitive_counter":
        response = (
            f"Acknowledge {competitor}'s pricing position, then pivot to quantified ROI. "
            f"Lead with {strategy_name} because the strongest churn driver is {strongest_driver}."
        )
    elif best_strategy and best_strategy.get("template_id") == "contract_renegotiation":
        response = (
            f"Open with renewal alignment and a value-based commercial structure. "
            f"Use {strategy_name} to counter {strongest_driver} before pricing becomes the only discussion."
        )
    elif best_strategy and best_strategy.get("template_id") == "direct_outreach":
        response = (
            f"Use a high-touch recovery motion led by CSM outreach. "
            f"Frame the conversation around {strongest_driver} and a concrete success plan."
        )
    else:
        response = (
            f"Position {strategy_name} as the fastest path to stabilize this account. "
            f"Anchor the message on {strongest_driver} and the next measurable value milestone."
        )

    return {
        "sentiment_label": sentiment_label,
        "sentiment_score": round(sentiment_score, 2),
        "usage_trend": usage_trend,
        "feature_requests_open": feature_requests,
        "support_history_summary": support_summary,
        "renewal_risk": renewal_risk,
        "months_to_renewal": months_to_renewal,
        "target_competitor": competitor,
        "competitor_pricing": competitor_pricing,
        "competitor_feature_gap": competitor_gap,
        "recommended_response": response,
    }

def update_learning_loop(template_id: str, outcome: str):
    """Updates global strategy weights based on outcomes."""
    adjustment = 0.05 if outcome == "recovered" else -0.02
    LEARNED_WEIGHTS[template_id] = max(0.1, min(2.0, LEARNED_WEIGHTS.get(template_id, 1.0) + adjustment))
    return LEARNED_WEIGHTS[template_id]
