from sqlalchemy import text

from backend.app.database import engine


with engine.begin() as connection:
    connection.execute(
        text(
            "ALTER TABLE standards "
            "ADD COLUMN IF NOT EXISTS status TEXT"
        )
    )

    connection.execute(
        text(
            "ALTER TABLE standards "
            "ADD COLUMN IF NOT EXISTS amendments TEXT"
        )
    )

    connection.execute(
        text(
            "ALTER TABLE standards "
            "ADD COLUMN IF NOT EXISTS source_type TEXT"
        )
    )

    connection.execute(
        text(
            "ALTER TABLE standards "
            "ADD COLUMN IF NOT EXISTS evidence_notes TEXT"
        )
    )


print("STANDARD METADATA COLUMNS READY")