import pytest

from ai.retriever import retrieve_standards


def test_retrieve_empty_query():
    with pytest.raises(ValueError):
        retrieve_standards("")


def test_retrieve_invalid_top_k():
    with pytest.raises(ValueError):
        retrieve_standards(
            "portable computers",
            top_k=0,
        )