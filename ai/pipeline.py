from ai.extractor import extract_requirements
from ai.normalizer import normalize_requirements
from ai.retriever import retrieve_standards
from ai.ranker import rank_candidates
from ai.uncertainty import assess_uncertainty


def build_retrieval_query(
    normalized: dict,
) -> str:
    """
    Build a semantic retrieval query from the normalized
    procurement requirements.
    """

    parts = []

    product = normalized.get("product")
    if product:
        parts.append(str(product))

    category = normalized.get("category")
    if category:
        parts.append(str(category))

    attributes = normalized.get("attributes", {})
    if isinstance(attributes, dict):
        for key, value in attributes.items():
            if value is not None:
                parts.append(f"{key}: {value}")

    constraints = normalized.get("constraints", {})
    if isinstance(constraints, dict):
        for key, value in constraints.items():
            if value is not None:
                parts.append(f"{key}: {value}")

    keywords = normalized.get("standards_keywords", [])
    if isinstance(keywords, list):
        parts.extend(
            str(keyword)
            for keyword in keywords
            if keyword
        )

    if parts:
        return " ".join(parts)

    return normalized.get(
        "raw_text",
        "",
    )


def analyze_requirement(
    query: str,
    top_k: int = 10,
) -> dict:
    """
    Run the complete AI procurement-standard recommendation pipeline.

    Flow:
        Raw requirement
        -> extraction
        -> normalization
        -> retrieval query construction
        -> semantic retrieval
        -> ranking
        -> uncertainty assessment
    """

    if not query or not query.strip():
        raise ValueError("Requirement text cannot be empty.")

    extracted = extract_requirements(query)

    normalized = normalize_requirements(
        extracted
    )

    retrieval_query = build_retrieval_query(
        normalized
    )

    candidates = retrieve_standards(
        query=retrieval_query,
        top_k=top_k,
    )

    ranked_candidates = rank_candidates(
        candidates,
        top_k=top_k,
    )

    uncertainty = assess_uncertainty(
        ranked_candidates
    )

    return {
        "query": query.strip(),
        "extracted_requirements": extracted,
        "normalized_requirements": normalized,
        "retrieval_query": retrieval_query,
        "recommended_standards": ranked_candidates,
        "uncertainty": uncertainty,
    }