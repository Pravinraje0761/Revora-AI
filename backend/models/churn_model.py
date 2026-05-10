import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
from typing import Dict, Any

MODEL_PATH = os.path.join(os.path.dirname(__file__), "churn_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

FEATURES = [
    "days_since_login",
    "feature_usage_score",
    "support_tickets_last30d",
    "plan_age_days",
    "mrr",
]

FEATURE_LABELS = {
    "days_since_login": "Days since last login",
    "feature_usage_score": "Feature usage score",
    "support_tickets_last30d": "Support tickets (30d)",
    "plan_age_days": "Account age (days)",
    "mrr": "Monthly revenue",
}


def get_risk_tier(score: float) -> str:
    if score >= 0.70:
        return "high"
    elif score >= 0.40:
        return "medium"
    return "low"


def train_model(customers_data: list[dict]) -> dict:
    """Train or retrain the churn model from customer data."""
    df = pd.DataFrame(customers_data)

    # Synthetic churn label based on known risk factors
    df["churned"] = (
        (df["days_since_login"] > 14).astype(int) * 3
        + (df["feature_usage_score"] < 30).astype(int) * 3
        + (df["support_tickets_last30d"] >= 3).astype(int) * 2
        + (df["plan_age_days"] < 30).astype(int) * 1
        + (df["mrr"] < 50).astype(int) * 1
    )
    df["churned"] = (df["churned"] >= 4).astype(int)

    X = df[FEATURES]
    y = df["churned"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_leaf=3,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train_scaled, y_train)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    y_pred = model.predict(X_test_scaled)
    report = classification_report(y_test, y_pred, output_dict=True)

    return {
        "accuracy": round(report["accuracy"] * 100, 1),
        "precision": round(report["1"]["precision"] * 100, 1),
        "recall": round(report["1"]["recall"] * 100, 1),
        "total_customers": len(df),
        "churners_in_data": int(y.sum()),
    }


def predict_single(customer: dict) -> Dict[str, Any]:
    """Score one customer. Returns score, tier, and top 3 churn reasons."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Model not trained yet. Run /predictions/train first.")

    model: RandomForestClassifier = joblib.load(MODEL_PATH)
    scaler: StandardScaler = joblib.load(SCALER_PATH)

    row = np.array([[customer[f] for f in FEATURES]], dtype=float)
    row_scaled = scaler.transform(row)

    churn_prob = float(model.predict_proba(row_scaled)[0][1])
    risk_tier = get_risk_tier(churn_prob)

    importances = model.feature_importances_
    feature_values = {f: customer[f] for f in FEATURES}

    reasons = _build_churn_reasons(feature_values, importances)

    return {
        "churn_score": round(churn_prob, 3),
        "risk_tier": risk_tier,
        "top_reasons": reasons[:3],
    }


def predict_batch(customers: list[dict]) -> list[Dict[str, Any]]:
    """Score many customers at once."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Model not trained yet.")

    model: RandomForestClassifier = joblib.load(MODEL_PATH)
    scaler: StandardScaler = joblib.load(SCALER_PATH)

    rows = np.array([[c[f] for f in FEATURES] for c in customers], dtype=float)
    rows_scaled = scaler.transform(rows)
    probs = model.predict_proba(rows_scaled)[:, 1]

    results = []
    importances = model.feature_importances_
    for i, customer in enumerate(customers):
        score = float(probs[i])
        feature_values = {f: customer[f] for f in FEATURES}
        reasons = _build_churn_reasons(feature_values, importances)
        results.append({
            "customer_id": customer["id"],
            "churn_score": round(score, 3),
            "risk_tier": get_risk_tier(score),
            "top_reasons": reasons[:3],
        })

    return results


def _build_churn_reasons(feature_values: dict, importances: np.ndarray) -> list[dict]:
    """Generate human-readable churn reason explanations with impact context."""
    reasons = []

    thresholds = {
        "days_since_login": (14, "Inactive for {val} days. Engagement has dropped below the critical threshold."),
        "feature_usage_score": (30, "Low feature adoption ({val}/100). Customer is not realizing the platform's full value."),
        "support_tickets_last30d": (2, "High support volume ({val} tickets). Signals potential frustration or onboarding friction."),
        "plan_age_days": (30, "New account ({val} days). High risk of early-stage abandonment during onboarding."),
        "mrr": (50, "Low-tier account (${val} MRR). Historically more sensitive to price adjustments."),
    }

    # Calculate mean feature importance for context
    mean_importance = importances.mean()

    for i, feature in enumerate(FEATURES):
        val = feature_values[feature]
        threshold, template = thresholds[feature]
        importance = importances[i]

        is_risky = (
            (feature == "days_since_login" and val > threshold)
            or (feature == "feature_usage_score" and val < threshold)
            or (feature == "support_tickets_last30d" and val > threshold)
            or (feature == "plan_age_days" and val < threshold)
            or (feature == "mrr" and val < threshold)
        )

        if is_risky:
            impact_level = "Critical" if importance > mean_importance * 1.5 else "Significant" if importance > mean_importance else "Moderate"
            reasons.append({
                "feature": FEATURE_LABELS[feature],
                "value": val,
                "description": template.format(val=round(val, 1)),
                "impact": impact_level,
                "weight": round(importance * 100, 1),
            })

    reasons.sort(key=lambda x: x["weight"], reverse=True)
    return reasons
