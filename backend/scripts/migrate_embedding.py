from sqlalchemy import text
from backend.app.database import engine

with engine.begin() as connection:
    connection.execute(
        text(
            "ALTER TABLE standards "
            "ADD COLUMN IF NOT EXISTS embedding vector(384)"
        )
    )

print("STANDARDS.EMBEDDING VECTOR(384) READY")