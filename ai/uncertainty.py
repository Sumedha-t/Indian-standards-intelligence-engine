def classify_confidence(score: float) -> str:
    """
    Classify the final recommendation score into a confidence level.

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
    Assess recommendation strength and ambiguity using the
    final compatibility-aware ranking score.
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

    # Use final_score when available.
    # Fall back to semantic score for backward compatibility.
    top_score = float(
        results[0].get(
            "final_score",
            results[0].get("score", 0.0),
        )
    )

    if len(results) == 1:
        margin = None
    else:
        second_score = float(
            results[1].get(
                "final_score",
                results[1].get("score", 0.0),
            )
        )

        margin = top_score - second_score

    confidence = classify_confidence(top_score)

    # Very weak final match
    if top_score < 0.65:
        return {
            "status": "INSUFFICIENT_MATCH",
            "confidence": confidence,
            "top_score": top_score,
            "margin": margin,
            "needs_clarification": True,
            "reason": (
                "The strongest recommended standard "
                "has insufficient relevance to the requirement."
            ),
        }

    # Strong score but very small separation from the next
    # recommendation means multiple standards remain plausible.
    if margin is not None and margin < 0.05:
        return {
            "status": "AMBIGUOUS",
            "confidence": confidence,
            "top_score": top_score,
            "margin": margin,
            "needs_clarification": True,
            "reason": (
                "Multiple standards have very similar "
                "final relevance scores."
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
            "standard recommendation was identified."
        ),
    }