from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    Certification,
    Notification,
    Standard,
    StandardNotification,
)


def get_standard_evidence(
    db: Session,
    standard_id: int,
) -> list[dict]:
    """
    Build source-backed evidence for one standard.

    Evidence is created only from records present in the database.
    Missing source information is preserved as None.
    """

    standard = db.get(Standard, standard_id)

    if standard is None:
        return []

    evidence = []

    # BIS standard evidence
    if standard.source_url:
        evidence.append(
            {
                "type": "BIS_STANDARD",
                "reference": standard.is_number,
                "source": standard.source_url,
                "supporting_information": (
                    standard.title
                    or "Standard record from the dataset."
                ),
            }
        )

    # Certification / CRS evidence
    certifications = db.scalars(
        select(Certification).where(
            Certification.standard_id == standard.id
        )
    ).all()

    for certification in certifications:
        if not certification.source_url:
            continue

        evidence.append(
            {
                "type": "BIS_CRS",
                "reference": standard.is_number,
                "source": certification.source_url,
                "supporting_information": (
                    certification.implementation_information
                    or certification.scheme_name
                    or "Certification record from the dataset."
                ),
            }
        )

    # Notification evidence
    standard_notifications = db.scalars(
        select(StandardNotification).where(
            StandardNotification.standard_id == standard.id
        )
    ).all()

    for standard_notification in standard_notifications:
        notification = db.get(
            Notification,
            standard_notification.notification_id,
        )

        if notification is None or not notification.source_url:
            continue

        evidence_type = "BIS_NOTIFICATION"

        if notification.notification_type:
            if "GOVERNMENT" in notification.notification_type.upper():
                evidence_type = "GOVERNMENT_NOTIFICATION"

        evidence.append(
            {
                "type": evidence_type,
                "reference": (
                    notification.notification_number
                    or standard.is_number
                ),
                "source": notification.source_url,
                "supporting_information": (
                    notification.implementation_information
                    or notification.title
                    or "Notification record from the dataset."
                ),
            }
        )

    return evidence