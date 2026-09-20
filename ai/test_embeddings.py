from ai.embeddings import embed_query


def test_embedding_dimension():
    vector = embed_query("portable computer for government employees")

    assert len(vector) == 384
    assert all(isinstance(x, float) for x in vector)