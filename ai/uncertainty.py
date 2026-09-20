def classify_confidence(score: float) -> str:
    """
    Classify semantic similarity into a retrieval-confidence level.

    This is an engineering heuristic, not a probability.
    """

    if score >= 0.80:
        return "HIGH"

    if score >= 0.65:
        return "MEDIUM"

    return "LOW"


def assess_uncertainty(
    results: list[dict],
) -> dict:
    """
    Assess retrieval strength and ambiguity.
    """

    if not results:
        return {
            "status": "NO_MATCH",
            "confidence": "LOW",
            "top_score": None,
            "margin": None,
            "needs_clarification": True,
            "reason": "No relevant standards were retrieved.",
        }

    top_score = float(results[0]["score"])

    if len(results) == 1:
        margin = None
    else:
        margin = (
            top_score
            - float(results[1]["score"])
        )

    confidence = classify_confidence(
        top_score
    )

    if top_score < 0.65:
        return {
            "status": "INSUFFICIENT_MATCH",
            "confidence": confidence,
            "top_score": top_score,
            "margin": margin,
            "needs_clarification": True,
            "reason": (
                "The strongest retrieved standard "
                "has a low semantic similarity score."
            ),
        }

    if margin is not None and margin < 0.05:
        return {
            "status": "AMBIGUOUS",
            "confidence": confidence,
            "top_score": top_score,
            "margin": margin,
            "needs_clarification": True,
            "reason": (
                "Multiple standards have very similar "
                "semantic similarity scores."
            ),
        }

    return {
        "status": "MATCH",
        "confidence": confidence,
        "top_score": top_score,
        "margin": margin,
        "needs_clarification": False,
        "reason": (
            "A sufficiently strong and distinguishable "
            "semantic match was retrieved."
        ),
    }