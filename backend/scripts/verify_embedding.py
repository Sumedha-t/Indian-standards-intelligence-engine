from sqlalchemy import text
from backend.app.database import engine

with engine.connect() as connection:
    result = connection.execute(
        text("""
            SELECT format_type(a.atttypid, a.atttypmod)
            FROM pg_attribute a
            JOIN pg_class t ON a.attrelid = t.oid
            WHERE t.relname = 'standards'
              AND a.attname = 'embedding';
        """)
    )

    print(result.fetchall())