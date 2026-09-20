import os
import time

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv("backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. "
        "Please configure DATABASE_URL in backend/.env."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_timeout=30,
    pool_use_lifo=True,
    connect_args={
        "connect_timeout": 15,
        "sslmode": "require",
    },
)


@event.listens_for(engine, "do_connect")
def retry_neon_connection(
    dialect,
    conn_rec,
    cargs,
    cparams,
):
    max_attempts = 5
    base_delay = 1.0
    last_error = None

    for attempt in range(1, max_attempts + 1):
        try:
            connection = dialect.dbapi.connect(
                *cargs,
                **cparams,
            )

            if attempt > 1:
                print(
                    "DATABASE CONNECTION RECOVERED "
                    f"ON ATTEMPT {attempt}/{max_attempts}"
                )

            return connection

        except Exception as exc:
            last_error = exc

            print(
                "DATABASE CONNECTION ATTEMPT "
                f"{attempt}/{max_attempts} FAILED: {exc}"
            )

            if attempt == max_attempts:
                raise

            delay = base_delay * (2 ** (attempt - 1))

            print(
                f"Retrying database connection in "
                f"{delay:.1f} seconds..."
            )

            time.sleep(delay)

    raise last_error


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()