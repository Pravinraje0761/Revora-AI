"""Tests for the churn model. They need no database, API keys or network."""
import json
import random

import pytest

import models.churn_model as cm


@pytest.fixture
def tmp_model_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(cm, "MODEL_PATH", str(tmp_path / "model.pkl"))
    monkeypatch.setattr(cm, "SCALER_PATH", str(tmp_path / "scaler.pkl"))
    monkeypatch.setattr(cm, "METRICS_PATH", str(tmp_path / "metrics.json"))
    return tmp_path


def _customers(n=300, seed=0):
    rng = random.Random(seed)
    return [
        {
            "id": f"c{i}",
            "days_since_login": rng.randint(0, 60),
            "feature_usage_score": rng.randint(0, 100),
            "support_tickets_last30d": rng.randint(0, 6),
            "plan_age_days": rng.randint(1, 900),
            "mrr": rng.choice([29, 99, 299, 499]),
        }
        for i in range(n)
    ]


def test_metrics_are_measured_and_saved(tmp_model_dir):
    metrics = cm.train_model(_customers())
    assert 0 <= metrics["accuracy"] <= 100
    assert metrics["test_size"] == 60
    assert "synthetic" in metrics["label_source"]
    assert cm.load_metrics() == json.loads((tmp_model_dir / "metrics.json").read_text())


def test_load_metrics_is_none_before_training(tmp_model_dir):
    assert cm.load_metrics() is None


def test_synthetic_label_rule():
    import pandas as pd

    df = pd.DataFrame([
        {"days_since_login": 30, "feature_usage_score": 10, "support_tickets_last30d": 0, "plan_age_days": 400, "mrr": 99},
        {"days_since_login": 1, "feature_usage_score": 90, "support_tickets_last30d": 0, "plan_age_days": 400, "mrr": 99},
    ])
    assert cm.synthetic_churn_label(df).tolist() == [1, 0]


def test_predictions_are_probabilities_with_tiers(tmp_model_dir):
    customers = _customers()
    cm.train_model(customers)
    preds = cm.predict_batch(customers[:20])
    assert len(preds) == 20
    for p in preds:
        assert 0.0 <= p["churn_score"] <= 1.0
        assert p["risk_tier"] in {"low", "medium", "high"}
        assert len(p["top_reasons"]) <= 3


def test_predict_without_model_raises(tmp_model_dir):
    with pytest.raises(FileNotFoundError):
        cm.predict_single(_customers(1)[0])
