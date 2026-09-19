from ai.ranker import rank_candidates


def test_rank_candidates():
    candidates = [
        {"standard_id": 3, "score": 0.72, "rank": 3},
        {"standard_id": 1, "score": 0.91, "rank": 1},
        {"standard_id": 2, "score": 0.84, "rank": 2},
    ]

    results = rank_candidates(candidates, top_k=3)

    assert [item["standard_id"] for item in results] == [1, 2, 3]

    assert results[0]["score"] == 0.91
    assert results[0]["rank"] == 1
    assert results[1]["rank"] == 2
    assert results[2]["rank"] == 3