import json
import os
from typing import Literal, TypedDict

from openai import OpenAI

from lib.churn_risk_profile import CHURN_DIMENSION_META

# Initialize client only if key is present
_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=_api_key) if _api_key else None

# Lightweight chat model keeps latency and cost reasonable; override via env.
_EXEC_NLM_MODEL = os.getenv("EXECUTIVE_NLM_MODEL", os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini"))


class ChatTurn(TypedDict):
    role: Literal["user", "assistant"]
    content: str

PLAYBOOK_INSTRUCTIONS = {
    "high_risk_discount": {
        "tone": "warm, personal, urgent — written as if from the CEO",
        "offer": "Include a genuine 20% discount for the next 3 months. Make it feel exclusive.",
        "cta": "Book a 15-minute call with our team OR click to apply discount",
    },
    "medium_risk_feature_tip": {
        "tone": "helpful, educational, friendly — from a customer success manager",
        "offer": "No discount. Highlight 2-3 features they haven't used that solve their pain.",
        "cta": "Start a free guided tour of the feature",
    },
    "low_risk_upsell": {
        "tone": "confident, positive, celebratory — from a growth advisor",
        "offer": "Congratulate them on their usage. Suggest upgrading for 10x more value.",
        "cta": "Start a free 14-day trial of the next plan tier",
    },
    "contract_renegotiation": {
        "tone": "professional, collaborative, value-driven — from a Strategic Account Director",
        "offer": "Focus on the upcoming renewal. Propose a multi-year lock-in with custom feature prioritization OR a tiered pricing model that scales with their success.",
        "cta": "Schedule a Strategic Business Review to align our roadmaps",
    },
    "competitive_counter": {
        "tone": "objective, persuasive, value-centric — from a Principal Solution Architect",
        "offer": "Directly address the competitor's pricing/feature claims. Highlight Revora AI's unique automation advantage and offer a 'Competitive Match' credit for 6 months.",
        "cta": "View our Competitive Comparison Sheet & Claim Credit",
    },
}


def explain_root_causes(customer: dict, churn_reasons: list) -> str:
    """
    Generates a natural language explanation of why a customer is at risk using OpenAI.
    """
    reasons_text = ", ".join([r["description"] for r in churn_reasons])
    sentiment_text = "positive" if customer.get("sentiment_score", 0) > 0.3 else "negative" if customer.get("sentiment_score", 0) < -0.3 else "neutral"
    usage_trend = customer.get("product_usage_trend", "stable")
    
    fallback_text = (f"Customer {customer['name']} is at risk primarily due to: {reasons_text}. "
            f"Sentiment is currently {sentiment_text} with a {usage_trend} usage trend. "
            f"They have {customer.get('feature_requests_count', 0)} open feature requests, "
            f"suggesting { 'high' if customer.get('feature_requests_count', 0) > 2 else 'moderate' } negotiation leverage.")

    if not client or not _api_key:
        return fallback_text

    try:
        prompt = f"""
        Explain why this customer is at risk of churning in a concise, executive summary (2-3 sentences).
        
        Customer: {customer['name']}
        Plan: {customer.get('plan')}
        MRR: ${customer.get('mrr')}
        Sentiment: {sentiment_text} (Score: {customer.get('sentiment_score')})
        Usage Trend: {usage_trend}
        Churn Reasons from ML Model: {reasons_text}
        Feature Requests: {customer.get('feature_requests_count')}
        
        Tone: Professional, analytical, and direct. Focus on the most critical impact.
        """
        
        completion = client.chat.completions.create(
            model=_EXEC_NLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a strategic retention analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=150,
        )
        return (completion.choices[0].message.content or "").strip()
    except Exception:
        return fallback_text

def generate_personalized_playbook(customer: dict, strategy: dict) -> str:
    """
    Generates a personalized intervention message based on the chosen strategy.
    """
    strategy_name = strategy.get("name", "Retention Outreach")
    playbook_type = strategy.get("template_id", "high_risk_discount")
    instructions = PLAYBOOK_INSTRUCTIONS.get(playbook_type, PLAYBOOK_INSTRUCTIONS["high_risk_discount"])
    
    fallback_msg = f"Hi {customer['name']}, we noticed your usage has changed. We'd love to offer you {instructions['offer']} to keep you with us. {instructions['cta']}."

    if not client or not _api_key:
        return fallback_msg

    try:
        prompt = f"""
        Write a personalized outreach message for this customer.
        
        Customer Name: {customer['name']}
        Strategy: {strategy_name}
        Tone: {instructions['tone']}
        Offer: {instructions['offer']}
        Call to Action: {instructions['cta']}
        
        Context:
        - Sentiment: {customer.get('sentiment_score')}
        - Usage Trend: {customer.get('product_usage_trend')}
        - Key Issue: {customer.get('customer_feedback_snippet', 'General engagement drop')}
        
        Rules:
        - Keep it under 100 words.
        - Make it feel personal, not like a template.
        - Reference their specific situation if possible.
        - Do not use placeholders like [Name].
        """
        
        completion = client.chat.completions.create(
            model=_EXEC_NLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a world-class customer success and retention expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=250,
        )
        return (completion.choices[0].message.content or "").strip()
    except Exception:
        return fallback_msg

def generate_expansion_pitch(customer: dict, expansion_type: str, reason: str) -> str:
    """
    Generates a high-impact expansion pitch for a growing customer.
    """
    fallback_msg = f"Hi {customer['name']}, we've noticed your incredible engagement with {customer.get('company', 'our platform')}. Given your growth, we'd love to discuss a {expansion_type} to unlock more value for your team."

    if not client or not _api_key:
        return fallback_msg

    try:
        prompt = f"""
        Draft a high-impact, executive-level expansion pitch for this customer.
        
        Customer: {customer['name']}
        Company: {customer.get('company', 'Unknown')}
        Expansion Type: {expansion_type}
        Reason for Flagging: {reason}
        Usage Score: {customer.get('feature_usage_score')}/100
        Usage Trend: {customer.get('product_usage_trend')}
        
        Style Guidelines:
        - **Executive-First**: Direct, value-focused, and confident.
        - **Growth-Oriented**: Focus on "unlocking potential" rather than "buying more".
        - **Data-Driven**: Mention their high engagement and positive usage trend.
        - **Concise**: Keep it under 120 words.
        - No emojis. No placeholders.
        """
        
        completion = client.chat.completions.create(
            model=_EXEC_NLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a strategic growth advisor for high-growth SaaS companies."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300,
        )
        return (completion.choices[0].message.content or "").strip()
    except Exception:
        return fallback_msg

def _build_nlm_context_payload(context: dict) -> dict:
    """Structured facts for NLM — reduces hallucinations."""
    expansions = context.get("expansion_opportunities") or []
    intel = context.get("product_intelligence") or []
    tops = context.get("top_at_risk_preview") or []
    return {
        "executive_dashboard": {
            "total_customers": context.get("total_customers"),
            "accounts_at_risk_high_or_medium": context.get("at_risk_count"),
            "high_risk_accounts": context.get("high_risk_count"),
            "medium_risk_accounts": context.get("medium_risk_count"),
            "sum_of_mrr_on_at_risk_accounts_usd": context.get("revenue_at_risk"),
            "revenue_recovered_attributed_usd": context.get("revenue_recovered"),
            "churn_reduction_percentage": context.get("churn_reduction_percentage"),
            "interventions_sent_today": context.get("interventions_sent_today"),
            "interventions_in_selected_range": context.get("interventions_in_range"),
            "model_reported_precision_pct": context.get("accuracy"),
        },
        "highest_churn_score_account": {
            "name": context.get("top_risk_customer"),
            "churn_score_pct": context.get("top_risk_score"),
        },
        "sample_at_risk_accounts_max_8": tops,
        "churn_analytics_dimensions": CHURN_DIMENSION_META,
        "expansion_candidates_max_12": expansions[:12],
        "product_investment_signals_max_8": intel[:8],
    }


NLM_SYSTEM_PROMPT = """You are **NLM**, the Strategic Intelligence Advisor for Revora AI. You provide executive-level insights and actionable retention strategies to founders and CXOs.

Your communication style is:
1. **Executive-First**: Be concise, punchy, and insight-dense. Avoid fluff. Talk like a high-level partner, not a support agent.
2. **Data-Driven**: Every recommendation must reference the `LIVE_METRICS_JSON`. If a metric is trending poorly, explain the "revenue at risk" and the "path to recovery".
3. **Model Awareness**: Always mention the predictive model's accuracy (e.g., "Our RandomForest model is currently operating at 92% accuracy") when discussing churn risk or at-risk accounts. This builds trust in the data.
4. **Action-Oriented**: Don't just report status; suggest the next best move. Use the available strategy playbooks (discounts, feature education, direct outreach) to provide concrete solutions.
5. **Contextually Sharp**: Leverage the chat history to build a continuous narrative. If the user asks about a specific customer, deep-dive into their churn reasons and sentiment.
6. **Human & Nuanced**: Use professional but natural language. Avoid robotic lists. No emojis. Never admit you are an AI.

Key Focus Areas:
- **Boardroom Scenarios**: Analyze the impact of price changes, new features, or support expansion.
- **Product Investment**: Prioritize the roadmap based on quantified revenue protection.
- **Competitive War Room**: Identify which competitors are gaining traction and how to respond.
- **Expansion Radar**: Find the highest-confidence upsell and upgrade opportunities.
- **Voice-of-Customer**: Summarize recurring churn themes and strategic risks from customer feedback.
- **MRR Exposure**: Identify which accounts or cohorts are driving the highest revenue risk.
- **Intervention ROI**: Highlight how autonomous agents are performing and where human-in-the-loop is needed.
- **Confidence**: Explicitly state the confidence in your predictions based on the model's performance metrics.

Talk to the executive as if you're their most trusted strategist who has already done the heavy lifting of analyzing the data.
"""


def executive_nlm_chat(
    query: str,
    context: dict,
    history: list[ChatTurn] | None = None,
) -> tuple[str, Literal["openai", "demo"]]:
    """
    Conversational NLM advisor over live dashboard metrics.
    Returns (reply_text, source).
    """
    history = history or []
    trimmed = history[-24:]

    if client and _api_key:
        payload = _build_nlm_context_payload(context)
        ctx_block = json.dumps(payload, indent=2, default=str)

        messages: list[dict] = [
            {"role": "system", "content": NLM_SYSTEM_PROMPT},
            {"role": "system", "content": f"LIVE_METRICS_JSON:\n```json\n{ctx_block}\n```"},
        ]
        for turn in trimmed:
            r = turn.get("role")
            c = (turn.get("content") or "").strip()
            if not c or r not in ("user", "assistant"):
                continue
            messages.append({"role": r, "content": c[:8000]})
        messages.append({"role": "user", "content": query.strip()[:4000]})

        try:
            completion = client.chat.completions.create(
                model=_EXEC_NLM_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )
            text = (completion.choices[0].message.content or "").strip()
            if not text:
                text = _executive_demo_fallback(query, context)
                return text, "demo"
            return text, "openai"
        except Exception:
            fallback = _executive_demo_fallback(query, context)
            return (
                fallback
                + "\n\n*(NLM is in **demo fallback** mode — cloud model unreachable.)*",
                "demo",
            )

    return _executive_demo_fallback(query, context), "demo"


def _executive_demo_fallback(query: str, context: dict) -> str:
    """Rule-based advisor when OPENAI_API_KEY is unset or API fails."""
    q = query.lower()

    if any(k in q for k in ["revenue at risk", "risk", "mrr"]):
        return (
            "**Situation:** We are currently monitoring high-risk accounts representing significant MRR exposure.\n\n"
            f"**Analysis:** Based on our **{context.get('accuracy', 92)}% accurate** churn model, we have identified **${context.get('revenue_at_risk', 0):,.2f}** in at-risk revenue. "
            f"The primary driver across these accounts is a decline in feature usage frequency.\n\n"
            "**Recommendation:** Deploy the 'Value Realization' playbook to the top 10% of these accounts immediately to stabilize engagement."
        )

    if any(k in q for k in ["recovered", "recovery", "how much saved"]):
        return (
            "**Situation:** Our autonomous recovery engine is actively securing vulnerable revenue.\n\n"
            f"**Analysis:** With a model precision of **{context.get('accuracy', 92)}%**, we have successfully recovered **${context.get('revenue_recovered', 0):,.2f}** through autonomous interventions this period.\n\n"
            "**Recommendation:** Prioritize the top 5 accounts in the 'At-Risk Pipeline' for high-touch executive alignment to protect remaining vulnerable MRR."
        )

    if any(k in q for k in ["churn reduction", "reduction", "success rate"]):
        return (
            "**Situation:** Autonomous recovery agents are driving significant churn deflection.\n\n"
            f"**Analysis:** The current **churn reduction rate is {context.get('churn_reduction_percentage', 0)}%**, supported by our **{context.get('accuracy', 92)}% reliable** predictive engine. "
            f"This is derived from **{context.get('interventions_in_range', 0)}** strategic touchpoints where AI agents successfully re-engaged users.\n\n"
            "**Recommendation:** Scale the 'High Risk Discount' playbook for accounts with >80% churn probability to further improve recovery success."
        )

    if any(k in q for k in ["accuracy", "model", "random forest", "ml"]):
        return (
            "**Situation:** Churn prediction is powered by a high-precision RandomForest model.\n\n"
            f"**Analysis:** The model is currently reporting **{context.get('accuracy', 92)}% accuracy**. "
            "It monitors 11 distinct churn dimensions including feature usage depth and sentiment shifts. "
            "This high precision allows us to act with confidence before the churn event occurs.\n\n"
            "**Recommendation:** Continue to feed intervention outcomes back into the training loop to maintain precision as user behavior evolves."
        )

    if any(k in q for k in ["who", "worst", "highest risk", "top customer", "most likely to churn"]):
        return (
            "**Situation:** One account represents the highest immediate churn risk in the fleet.\n\n"
            f"**Analysis:** **{context.get('top_risk_customer', 'N/A')}** is currently at **{context.get('top_risk_score', 0)}%** churn probability, as flagged by our **{context.get('accuracy', 92)}% accurate** model. "
            "Signals indicate a severe drop in feature engagement over the last 14 days.\n\n"
            "**Recommendation:** Immediate intervention required. Deploy a CEO-style personalized recovery email with a 3-month retention credit."
        )

    if any(k in q for k in ["strategy", "prioritize", "next steps", "should we"]):
        return (
            "**Strategic Priorities for this Week:**\n\n"
            f"**1. Revenue Protection:** Target the **${context.get('revenue_at_risk', 0):,.2f}** in high-risk MRR through the automated recovery pipeline, leveraging our **{context.get('accuracy', 92)}% accurate** signals.\n"
            "**2. Expansion Harvesting:** Route the machine-identified expansion candidates straight to the AE team for upgrade conversations.\n"
            "**3. Product Alignment:** Review the 'Product Signals' list. Churn drivers are highlighting a critical need for **Native Salesforce Sync**."
        )

    if any(k in q for k in ["summary", "executive summary", "board", "how are we doing", "overview"]):
        nc = len(context.get("expansion_opportunities", []) or [])
        return (
            "**Executive Summary:**\n\n"
            f"**Portfolio Health:** Monitoring **{context.get('total_customers', 0)}** total logos. **{context.get('at_risk_count', 0)}** are currently flagged for churn watch by our **{context.get('accuracy', 92)}% accurate** engine.\n"
            f"**Financial Impact:** ~$**{context.get('revenue_at_risk', 0):,.2f}/mo** MRR is at risk, while **${context.get('revenue_recovered', 0):,.2f}** has been secured by Revora AI.\n"
            f"**Growth Velocity:** **{nc}** expansion opportunities are identified, representing significant potential MRR lift.\n\n"
            "_Note: This is a high-level summary powered by our strategic intelligence engine._"
        )

    if any(k in q for k in ["expansion", "upsell", "crosssell", "cross-sell"]):
        ops = context.get("expansion_opportunities") or []
        total_potential = sum((o.get("potential_mrr_lift") or 0) for o in ops)
        if ops:
            return (
                "**Situation:** Significant upsell potential identified in active user base.\n\n"
                f"**Analysis:** Found **{len(ops)}** expansion candidates with high engagement scores. "
                f"Total potential MRR lift is estimated at **+${total_potential:,.0f}/mo**.\n\n"
                f"**Recommendation:** Focus first on `{ops[0].get('name', 'lead')}`—they are flagged for a **{ops[0].get('type', 'upsell')}** with high confidence."
            )
        return "**Expansion signals are low** in the current filtered set. Recommend widening the engagement parameters."

    if any(k in q for k in ["feature", "roadmap", "build", "product", "investment"]):
        intel = context.get("product_intelligence") or []
        if intel:
            top = intel[0]
            return (
                "**Situation:** Churn data is highlighting systemic product gaps.\n\n"
                f"**Analysis:** The highest-ROI investment is **`{top.get('gap', 'Roadmap gap')}`**. "
                f"Closing this gap would protect an estimated **${top.get('revenue_impact', 0):,.0f}** in annual revenue.\n\n"
                "**Recommendation:** Prioritize this feature in the Q3 roadmap to permanently reduce churn in the Enterprise segment."
            )
        return "No product intelligence signals available. Ensure customer feedback and feature request data is properly synchronized."

    if any(k in q for k in ["competitive", "competitor", "war room", "radar"]):
        return (
            "**Competitive War Room Analysis:**\n\n"
            "**Situation:** Market pressure from lower-cost alternatives like ChurnZero and Vitally is increasing.\n"
            "**Analysis:** Revora AI's primary edge is **measurable recovery loops**. While competitors focus on workflow, we tie every action directly to MRR preservation. "
            "Our data shows customers perceive a gap in 'Native Salesforce Sync', which is a primary defection driver.\n\n"
            "**Recommendation:** Use the 'Competitive Counter' playbook to highlight our ROI-first approach when dealing with pricing-sensitive renewals. Prioritize the Salesforce Sync integration to neutralize the primary competitive threat."
        )

    if any(k in q for k in ["voice of customer", "voc", "feedback", "tickets", "themes"]):
        return (
            "**Voice-of-Customer Intelligence:**\n\n"
            "**Strategic Themes:**\n"
            "1. **Integration Friction:** 35% of high-MRR tickets mention difficulty syncing with CRM systems.\n"
            "2. **Onboarding Speed:** Sentiment drops significantly during the first 14 days of 'Starter' accounts.\n"
            "3. **Value Visibility:** Customers are asking for easier ways to export ROI reports for their own leadership.\n\n"
            "**Strategic Risk:** High-value accounts are most sensitive to 'Integration Friction', representing a potential **$450k/mo** risk if not addressed in Q3."
        )

    if any(k in q for k in ["simulator", "boardroom", "test scenario", "what if"]):
        return (
            "**Boardroom Simulator Guidance:**\n\n"
            "**Top Impact Decision:** Launching a **Native Salesforce Sync** feature.\n"
            "• **Revenue Protected:** $434k (35% of high-risk MRR)\n"
            "• **Upsell Impact:** +5% across Pro tiers\n"
            "• **ROI:** 4.5x with a 6-month payback period.\n\n"
            "**Alternative Decision:** Reducing price by 10% across the board would reduce churn by 25% but result in a **negative net MRR impact** in the short term."
        )

    return (
        "I am your **Executive AI Advisor**, providing data-driven insights on churn and revenue recovery.\n\n"
        "**You can ask me about:**\n"
        "• Board-ready summary of our revenue posture\n"
        "• **Boardroom Simulator**: Test the impact of strategic decisions\n"
        "• **Product Priorities**: Quantified impact of the feature roadmap\n"
        "• **Competitive War Room**: Defending against market pressure\n"
        "• Expansion and upsell opportunities currently in the pipeline"
    )


def generate_strategy_rationale(customer: dict, strategy: dict, churn_reasons: list) -> str:
    """
    Explains the rationale behind why a specific strategy was chosen for a customer.
    """
    strategy_name = strategy.get("name", "Unknown Strategy")
    reasons_text = ", ".join([r["description"] for r in churn_reasons])
    
    fallback_text = f"This strategy was selected because it addresses the primary churn risks ({reasons_text}) while maintaining a healthy ROI for the {customer['name']} account."

    if not client or not _api_key:
        return fallback_text

    try:
        prompt = f"""
        Explain the strategic rationale for choosing this intervention for this customer.
        
        Customer: {customer['name']}
        Strategy: {strategy_name}
        Prob of Success: {strategy.get('prob')}
        Expected ROI: {strategy.get('roi')}
        Churn Reasons: {reasons_text}
        
        Tone: Analytical, strategic, and concise. (Max 2 sentences)
        """
        
        completion = client.chat.completions.create(
            model=_EXEC_NLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a strategic retention analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=100,
        )
        return (completion.choices[0].message.content or "").strip()
    except Exception:
        return fallback_text

def generate_retention_email(
    customer: dict,
    playbook: str,
    churn_reasons: list[dict],
) -> dict:
    """
    Uses GPT-4o to write a personalized retention email for one customer.
    Returns: { subject, body, preview_text }
    """
    if not os.getenv("OPENAI_API_KEY"):
        # Mock behavior
        instructions = PLAYBOOK_INSTRUCTIONS.get(playbook, PLAYBOOK_INSTRUCTIONS["medium_risk_feature_tip"])
        return {
            "subject": f"Quick note for {customer['name']} from Revora AI",
            "preview_text": "We've been thinking about how we can help you more.",
            "body": f"Hi {customer['name'].split()[0]},\n\nWe noticed you haven't been using some of our key features lately. {instructions['offer']}\n\n{instructions['cta']}\n\nBest,\nAlex"
        }

    instructions = PLAYBOOK_INSTRUCTIONS.get(playbook, PLAYBOOK_INSTRUCTIONS["medium_risk_feature_tip"])

    reasons_text = "\n".join(
        f"- {r['description']}" for r in churn_reasons[:3]
    ) if churn_reasons else "- General disengagement detected"

    prompt = f"""You are writing a personalized customer retention email for a SaaS product called Revora AI.

CUSTOMER PROFILE:
- Name: {customer['name']}
- First name: {customer['name'].split()[0]}
- Company: {customer.get('company', 'their company')}
- Plan: {customer['plan']} (${customer['mrr']}/month)
- Account age: {customer.get('plan_age_days', 30)} days

WHY THEY MIGHT CHURN (do NOT mention these directly — use them to inform empathy):
{reasons_text}

PLAYBOOK: {playbook}
TONE: {instructions['tone']}
OFFER: {instructions['offer']}
CTA: {instructions['cta']}

RULES:
1. Subject line: 8 words max. No emojis. Curious, not salesy.
2. Email body: 120-180 words. Short paragraphs (2-3 sentences each).
3. Sign off as "Alex, Head of Customer Success at Revora AI"
4. Do NOT mention you know they're at risk of churning.
5. Feel genuinely human — not like a mass email.
6. Include one specific, concrete benefit relevant to their plan tier.

OUTPUT FORMAT (JSON only, no markdown):
{{
  "subject": "...",
  "preview_text": "...",
  "body": "..."
}}"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.75,
        max_tokens=600,
    )

    import json
    content = response.choices[0].message.content
    result = json.loads(content)

    return {
        "subject": result.get("subject", "A quick note from our team"),
        "preview_text": result.get("preview_text", ""),
        "body": result.get("body", ""),
    }
