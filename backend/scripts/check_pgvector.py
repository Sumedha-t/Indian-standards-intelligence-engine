from sqlalchemy import text
from backend.app.database import engine

with engine.connect() as connection:
    result = connection.execute(
        text("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")
    )

    print(result.fetchall())