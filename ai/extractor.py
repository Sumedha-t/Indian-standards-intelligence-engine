from typing import Any

from ai.llm import generate_structured_output


def extract_requirements(text: str) -> dict[str, Any]:
    """
    Extract structured procurement requirements using the LLM layer.
    """

    if not text or not text.strip():
        raise ValueError("Requirement text cannot be empty.")

    prompt = f"""
Extract the procurement requirements from the following text.

Return a structured object containing:
- product
- category
- attributes
- constraints
- standards_keywords

Requirement:
{text.strip()}
"""

    result = generate_structured_output(prompt)

    return {
        "raw_text": text.strip(),
        "product": result.get("product"),
        "category": result.get("category"),
        "attributes": result.get("attributes", {}),
        "constraints": result.get("constraints", {}),
        "standards_keywords": result.get(
            "standards_keywords", []
        ),
    }