def rank_candidates(
    candidates: list[dict],
    top_k: int = 10,
) -> list[dict]:
    """
    Rank retrieved standards by semantic similarity score.
    """

    if top_k <= 0:
        raise ValueError("top_k must be greater than 0.")

    ranked = sorted(
        candidates,
        key=lambda item: item["score"],
        reverse=True,
    )

    ranked = ranked[:top_k]

    for rank, candidate in enumerate(ranked, start=1):
        candidate["rank"] = rank

    return ranked