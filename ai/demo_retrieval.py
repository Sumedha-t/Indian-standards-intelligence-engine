from ai.retriever import retrieve_standards
from backend.app.database import SessionLocal
from backend.app.models import Standard


def demo_retrieval(query: str, top_k: int = 5) -> None:
    print("=" * 70)
    print("AI STANDARD RETRIEVAL DEMO")
    print("=" * 70)

    print(f"\nRequirement:")
    print(query)

    results = retrieve_standards(query, top_k=top_k)

    if not results:
        print("\nNo standards retrieved.")
        return

    db = SessionLocal()

    try:
        print("\nTop retrieved standards:\n")

        for result in results:
            standard = (
                db.query(Standard)
                .filter(Standard.id == result["standard_id"])
                .first()
            )

            if standard is None:
                continue

            print(f"Rank:       {result['rank']}")
            print(f"Standard:   {standard.is_number}")
            print(f"Title:      {standard.title}")
            print(f"Score:      {result['score']:.4f}")
            print(f"ID:         {result['standard_id']}")
            print("-" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    query = input("\nEnter procurement requirement: ").strip()

    if not query:
        print("Requirement cannot be empty.")
    else:
        demo_retrieval(query)