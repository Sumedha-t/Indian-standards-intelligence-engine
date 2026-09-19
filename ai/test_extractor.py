import pytest

from ai.extractor import extract_requirements


def test_extract_requirements():
    result = extract_requirements(
        "Portable computers for government employees"
    )

    assert result["raw_text"] == (
        "Portable computers for government employees"
    )

    assert "product" in result
    assert "category" in result
    assert "attributes" in result
    assert "constraints" in result
    assert "standards_keywords" in result


def test_empty_requirement():
    with pytest.raises(ValueError):
        extract_requirements("")