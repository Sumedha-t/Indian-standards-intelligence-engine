from backend.app.database import SessionLocal
from backend.app.models import Standard
from ai.embeddings import embed_standard


def build_standard_text(standard: Standard) -> str:
    parts = [
        standard.is_number,
        standard.title,
        standard.scope,
        standard.department,
        standard.technical_committee,
        standard.classification,
        standard.status,
        standard.revision,
        standard.lifecycle_status,
        standard.evidence_notes,
    ]

    return " | ".join(
        str(part).strip()
        for part in parts
        if part is not None and str(part).strip()
    )


def main():
    with SessionLocal() as db:
        standards = (
            db.query(Standard)
            .order_by(Standard.id)
            .all()
        )

        print(
            f"Found {len(standards)} standards."
        )

        updated = 0

        for index, standard in enumerate(
            standards,
            start=1,
        ):
            text = build_standard_text(standard)

            if not text:
                print(
                    f"Skipping {standard.id}: "
                    "no text available."
                )
                continue

            standard.embedding = embed_standard(text)

            updated += 1

            print(
                f"[{index}/{len(standards)}] "
                f"Embedded {standard.is_number}"
            )

        db.commit()

        print(
            f"EMBEDDING INDEXING COMPLETE: "
            f"{updated} standards updated."
        )


if __name__ == "__main__":
    main()