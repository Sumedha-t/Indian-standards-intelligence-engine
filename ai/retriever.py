from ai.embeddings import embed_query


def retrieve_standards(
    query: str,
    top_k: int = 10,
) -> list[dict]:
    """
    Retrieve the most semantically relevant standards for a query.

    Returns:
        [
            {
                "standard_id": <database id>,
                "score": <cosine similarity>,
                "rank": <1-based rank>
            }
        ]
    """

    if not query or not query.strip():
        raise ValueError("Query text cannot be empty.")

    if top_k <= 0:
        raise ValueError("top_k must be greater than 0.")

    query_embedding = embed_query(query)

    # Import database components only when actual retrieval is performed.
    # This keeps unit tests that mock retrieval independent of PostgreSQL.
    from backend.app.database import SessionLocal
    from backend.app.models import Standard

    with SessionLocal() as db:
        distance = Standard.embedding.cosine_distance(query_embedding)

        rows = (
            db.query(
                Standard.id,
                distance.label("distance"),
            )
            .filter(Standard.embedding.isnot(None))
            .order_by(distance)
            .limit(top_k)
            .all()
        )

    results = []

    for rank, row in enumerate(rows, start=1):
        score = 1.0 - float(row.distance)

        results.append(
            {
                "standard_id": row.id,
                "score": score,
                "rank": rank,
            }
        )

    return results