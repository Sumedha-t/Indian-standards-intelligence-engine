from backend.app.database import SessionLocal
from backend.app.models import Standard

db = SessionLocal()

try:
    standard = Standard(
        is_number="TEST-IS-0001",
        title="Test Standard - DELETE ME",
        scope="Prototype database connectivity test",
        lifecycle_status="UNKNOWN",
        source_url="PROJECT_DATASET",
    )

    db.add(standard)
    db.commit()
    db.refresh(standard)

    print("INSERT SUCCESSFUL")
    print("ID:", standard.id)
    print("IS NUMBER:", standard.is_number)

finally:
    db.close()