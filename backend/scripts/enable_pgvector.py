from sqlalchemy import text
from backend.app.database import engine

with engine.begin() as connection:
    connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

print("PGVECTOR EXTENSION ENABLED")