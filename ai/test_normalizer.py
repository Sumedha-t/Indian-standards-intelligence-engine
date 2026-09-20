import pytest

from ai.normalizer import (
    normalize_product,
    normalize_requirements,
)


def test_normalize_product():
    result = normalize_product(
        "  Portable   Computer  "
    )

    assert result == "portable computer"


def test_empty_product():
    assert normalize_product("") is None
    assert normalize_product(None) is None


def test_normalize_requirements():
    extracted = {
        "raw_text": "Portable computers",
        "product": "  Portable   Computer ",
        "category": " ELECTRONICS ",
        "attributes": {},
        "constraints": {},
        "standards_keywords": [],
    }

    result = normalize_requirements(extracted)

    assert result["product"] == "portable computer"
    assert result["category"] == "electronics"


def test_invalid_input():
    with pytest.raises(ValueError):
        normalize_requirements(None)