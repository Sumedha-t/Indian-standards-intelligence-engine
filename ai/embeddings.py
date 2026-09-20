from sentence_transformers import SentenceTransformer


MODEL_NAME = "intfloat/multilingual-e5-small"
EMBEDDING_DIMENSION = 384

_model = SentenceTransformer(MODEL_NAME)


def embed_query(text: str) -> list[float]:
    """
    Generate a 384-dimensional embedding for a user/query text.
    """
    if not text or not text.strip():
        raise ValueError("Query text cannot be empty.")

    embedding = _model.encode(
        f"query: {text.strip()}",
        normalize_embeddings=True,
    )

    return embedding.tolist()


def embed_standard(text: str) -> list[float]:
    """
    Generate a 384-dimensional embedding for a standard document.
    """
    if not text or not text.strip():
        raise ValueError("Standard text cannot be empty.")

    embedding = _model.encode(
        f"passage: {text.strip()}",
        normalize_embeddings=True,
    )

    return embedding.tolist()