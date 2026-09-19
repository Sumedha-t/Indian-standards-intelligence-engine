import pytest

from ai.uncertainty import (
    assess_uncertainty,
    classify_confidence,
)


def test_confidence_levels():
    assert classify_confidence(0.85) == "HIGH"
    assert classify_confidence(0.70) == "MEDIUM"
    assert classify_confidence(0.50) == "LOW"


def test_no_match():
    result = assess_uncertainty([])

    assert result["status"] == "NO_MATCH"
    assert result["confidence"] == "LOW"
    assert result["needs_clarification"] is True
    assert result["reason"]


def test_strong_match():
    results = [
        {
            "standard_id": 1,
            "score": 0.91,
            "rank": 1,
        },
        {
            "standard_id": 2,
            "score": 0.72,
            "rank": 2,
        },
    ]

    result = assess_uncertainty(results)

    assert result["status"] == "MATCH"
    assert result["confidence"] == "HIGH"
    assert result["needs_clarification"] is False
    assert result["margin"] == pytest.approx(0.19)
    assert result["reason"]


def test_ambiguous_match():
    results = [
        {
            "standard_id": 1,
            "score": 0.82,
            "rank": 1,
        },
        {
            "standard_id": 2,
            "score": 0.79,
            "rank": 2,
        },
    ]

    result = assess_uncertainty(results)

    assert result["status"] == "AMBIGUOUS"
    assert result["confidence"] == "HIGH"
    assert result["needs_clarification"] is True
    assert result["reason"]


def test_insufficient_match():
    results = [
        {
            "standard_id": 1,
            "score": 0.42,
            "rank": 1,
        },
    ]

    result = assess_uncertainty(results)

    assert result["status"] == "INSUFFICIENT_MATCH"
    assert result["confidence"] == "LOW"
    assert result["needs_clarification"] is True
    assert result["reason"]