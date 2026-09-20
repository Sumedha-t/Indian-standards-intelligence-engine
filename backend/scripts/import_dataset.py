import csv

from sqlalchemy import select

from backend.app.database import SessionLocal
from backend.app.models import (
    Authority,
    Certification,
    Notification,
    Standard,
    StandardNotification,
    StandardRelationship,
)


ALLOWED_RELATIONSHIPS = {
    "NORMATIVE_REFERENCE",
    "TEST_METHOD",
    "SAFETY_STANDARD",
    "MATERIAL_STANDARD",
    "RELATED_STANDARD",
    "SUPERSEDES",
}


STANDARDS_CSV = "data/processed/standards.csv"
RELATIONSHIPS_CSV = "data/processed/standard_relationships.csv"
CERTIFICATIONS_CSV = "data/processed/certifications_notifications.csv"


def clean(value):
    if value is None:
        return None

    value = value.strip()

    if value == "" or value.upper() == "NULL":
        return None

    return value


def import_standards(db):
    with open(
        STANDARDS_CSV,
        newline="",
        encoding="utf-8-sig",
    ) as file:
        rows = csv.DictReader(file)

        count = 0

        for row in rows:
            is_number = clean(row["is_number"])

            standard = db.scalar(
                select(Standard).where(
                    Standard.is_number == is_number
                )
            )

            if standard is None:
                standard = Standard(is_number=is_number)
                db.add(standard)

            standard.title = clean(row["title"])
            standard.scope = clean(row["scope"])
            standard.department = clean(row["department"])
            standard.technical_committee = clean(
                row["technical_committee"]
            )
            standard.classification = clean(
                row["classification"]
            )
            standard.status = clean(row["status"])
            standard.revision = clean(row["revision"])
            standard.review_or_reaffirmation = clean(
                row["review_or_reaffirmation"]
            )
            standard.amendments = clean(row["amendments"])
            standard.lifecycle_status = (
                clean(row["lifecycle_status"]) or "UNKNOWN"
            )
            standard.source_url = clean(row["source_url"])
            standard.source_type = clean(row["source_type"])
            standard.evidence_notes = clean(
                row["evidence_notes"]
            )

            count += 1

    db.flush()
    return count


def import_relationships(db):
    with open(
        RELATIONSHIPS_CSV,
        newline="",
        encoding="utf-8-sig",
    ) as file:
        rows = csv.DictReader(file)

        count = 0

        for row in rows:
            source_is_number = clean(
                row["source_is_number"]
            )

            target_is_number = clean(
                row["target_is_number"]
            )

            relationship_type = clean(
                row["relationship_type"]
            )

            if relationship_type not in ALLOWED_RELATIONSHIPS:
                raise ValueError(
                    f"Unsupported relationship type: "
                    f"{relationship_type}"
                )

            source_standard = db.scalar(
                select(Standard).where(
                    Standard.is_number == source_is_number
                )
            )

            target_standard = db.scalar(
                select(Standard).where(
                    Standard.is_number == target_is_number
                )
            )

            if (
                source_standard is None
                or target_standard is None
            ):
                missing = []

                if source_standard is None:
                    missing.append(source_is_number)

                if target_standard is None:
                    missing.append(target_is_number)

                print(
                    "SKIPPING RELATIONSHIP - "
                    "STANDARD NOT IN DATASET:",
                    " -> ".join(missing),
                )

                continue

            existing = db.scalar(
                select(StandardRelationship).where(
                    StandardRelationship.source_standard_id
                    == source_standard.id,
                    StandardRelationship.target_standard_id
                    == target_standard.id,
                    StandardRelationship.relationship_type
                    == relationship_type,
                )
            )

            if existing is None:
                relationship = StandardRelationship(
                    source_standard_id=source_standard.id,
                    target_standard_id=target_standard.id,
                    relationship_type=relationship_type,
                    source=clean(row["source_url"]),
                )

                db.add(relationship)

            count += 1

    db.flush()
    return count


def import_certifications(db):
    with open(
        CERTIFICATIONS_CSV,
        newline="",
        encoding="utf-8-sig",
    ) as file:
        rows = csv.DictReader(file)

        count = 0

        for row in rows:
            is_number = clean(row["is_number"])

            standard = db.scalar(
                select(Standard).where(
                    Standard.is_number == is_number
                )
            )

            if standard is None:
                raise ValueError(
                    f"Certification standard not found: "
                    f"{is_number}"
                )

            authority_name = clean(row["authority"])
            authority = None

            if authority_name:
                authority = db.scalar(
                    select(Authority).where(
                        Authority.name == authority_name
                    )
                )

                if authority is None:
                    authority = Authority(
                        name=authority_name,
                        type="REGULATORY_AUTHORITY",
                        source_url=clean(
                            row["source_url"]
                        ),
                    )

                    db.add(authority)
                    db.flush()

            existing_certification = db.scalar(
                select(Certification).where(
                    Certification.scheme_name
                    == clean(row["scheme_name"]),
                    Certification.product_category
                    == clean(row["product_category"]),
                    Certification.standard_id
                    == standard.id,
                )
            )

            if existing_certification is None:
                certification = Certification(
                    scheme_name=clean(
                        row["scheme_name"]
                    ),
                    product_category=clean(
                        row["product_category"]
                    ),
                    standard_id=standard.id,
                    applicability=clean(
                        row["mandatory_status"]
                    ),
                    implementation_information=clean(
                        row["evidence_notes"]
                    ),
                    source_url=clean(
                        row["source_url"]
                    ),
                )

                db.add(certification)
                db.flush()

            notification_number = clean(
                row["notification_number"]
            )

            if notification_number:
                notification = db.scalar(
                    select(Notification).where(
                        Notification.notification_number
                        == notification_number
                    )
                )

                if notification is None:
                    notification = Notification(
                        notification_number=(
                            notification_number
                        ),
                        title=clean(
                            row["scheme_name"]
                        ),
                        date=clean(
                            row["notification_date"]
                        ),
                        authority_id=(
                            authority.id
                            if authority
                            else None
                        ),
                        notification_type=clean(
                            row["record_type"]
                        ),
                        implementation_information=clean(
                            row["effective_date"]
                        ),
                        source_url=clean(
                            row["source_url"]
                        ),
                    )

                    db.add(notification)
                    db.flush()

                existing_link = db.scalar(
                    select(StandardNotification).where(
                        StandardNotification.standard_id
                        == standard.id,
                        StandardNotification.notification_id
                        == notification.id,
                    )
                )

                if existing_link is None:
                    db.add(
                        StandardNotification(
                            standard_id=standard.id,
                            notification_id=notification.id,
                            relationship=(
                                "CERTIFICATION_SCHEME"
                            ),
                        )
                    )

            count += 1

    db.flush()
    return count


def main():
    with SessionLocal() as db:
        standards_count = import_standards(db)

        relationships_count = import_relationships(db)

        certifications_count = import_certifications(db)

        db.commit()

        print(
            f"Standards processed: {standards_count}"
        )

        print(
            f"Relationships processed: "
            f"{relationships_count}"
        )

        print(
            f"Certifications processed: "
            f"{certifications_count}"
        )

        print("DATASET IMPORT SUCCESSFUL")


if __name__ == "__main__":
    main()