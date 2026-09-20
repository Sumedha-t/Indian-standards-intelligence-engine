import pytest

from ai.llm import generate_structured_output


def test_generate_structured_output():
    result = generate_structured_output(
        "Extract the product from: portable computers"
    )

    assert isinstance(result, dict)
    assert "product" in result
    assert "category" in result
    assert "attributes" in result
    assert "constraints" in result
    assert "standards_keywords" in result


def test_empty_prompt():
    with pytest.raises(ValueError):
        generate_structured_output("")