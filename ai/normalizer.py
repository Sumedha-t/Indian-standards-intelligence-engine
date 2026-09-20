from typing import Any


def normalize_product(product: str | None) -> str | None:
    """
    Normalize a product name for semantic retrieval.
    """

    if product is None:
        return None

    product = product.strip()

    if not product:
        return None

    # Basic normalization only.
    # Domain-specific normalization can be added later.
    return " ".join(product.lower().split())


def normalize_requirements(
    extracted: dict[str, Any],
) -> dict[str, Any]:
    """
    Normalize the structured requirements produced by the extractor.
    """

    if not isinstance(extracted, dict):
        raise ValueError("Extracted requirements must be a dictionary.")

    normalized = dict(extracted)

    normalized["product"] = normalize_product(
        extracted.get("product")
    )

    if extracted.get("category"):
        normalized["category"] = (
            str(extracted["category"]).strip().lower()
        )

    return normalized