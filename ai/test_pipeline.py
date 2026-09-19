from unittest.mock import patch

import pytest

from ai.pipeline import (
    analyze_requirement,
    build_retrieval_query,
)


def test_build_retrieval_query():
    normalized = {
        "product": "portable computer",
        "category": "information technology equipment",
        "attributes": {
            "ram": "8 GB minimum",
            "wireless_connectivity": True,
        },
        "constraints": {
            "intended_use": "government employees",
        },
        "standards_keywords": [
            "portable computer",
            "wireless connectivity",
        ],
        "raw_text": "Portable computers",
    }

    result = build_retrieval_query(normalized)

    assert "portable computer" in result
    assert "information technology equipment" in result
    assert "ram: 8 GB minimum" in result
    assert "wireless_connectivity: True" in result
    assert "intended_use: government employees" in result
    assert "wireless connectivity" in result


def test_build_retrieval_query_fallback():
    normalized = {
        "product": None,
        "category": None,
        "attributes": {},
        "constraints": {},
        "standards_keywords": [],
        "raw_text": "Portable computers",
    }

    result = build_retrieval_query(normalized)

    assert result == "Portable computers"


@patch("ai.pipeline.retrieve_standards")
def test_analyze_requirement(mock_retrieve):

    mock_retrieve.return_value = [
        {
            "standard_id": 12,
            "score": 0.91,
            "rank": 1,
        },
        {
            "standard_id": 7,
            "score": 0.72,
            "rank": 2,
        },
    ]

    result = analyze_requirement(
        "portable computers for government employees",
        top_k=10,
    )

    assert result["query"] == (
        "portable computers for government employees"
    )

    assert "extracted_requirements" in result
    assert "normalized_requirements" in result
    assert "retrieval_query" in result
    assert "recommended_standards" in result
    assert "uncertainty" in result

    assert len(result["recommended_standards"]) == 2
    assert result["recommended_standards"][0]["standard_id"] == 12

    assert result["uncertainty"]["status"] == "MATCH"
    assert result["uncertainty"]["confidence"] == "HIGH"


@patch("ai.pipeline.retrieve_standards")
def test_analyze_empty_results(mock_retrieve):

    mock_retrieve.return_value = []

    result = analyze_requirement(
        "some completely unrelated requirement",
    )

    assert result["recommended_standards"] == []
    assert result["uncertainty"]["status"] == "NO_MATCH"
    assert result["uncertainty"]["needs_clarification"] is True


def test_empty_requirement():

    with pytest.raises(ValueError):
        analyze_requirement("")