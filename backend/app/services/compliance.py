from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    Certification,
    Notification,
    Standard,
    StandardNotification,
)


def get_standard_compliance(
    db: Session,
    standard_id: int,
) -> dict:
    """
    Return lifecycle, regulatory, and certification information
    for one standard.

    All information comes from authoritative database records.
    Missing information is represented with UNKNOWN or empty lists.
    """

    standard = db.get(Standard, standard_id)

    if standard is None:
        return {
            "lifecycle": {
                "status": "UNKNOWN",
                "standard_status": None,
                "revision": None,
                "review_or_reaffirmation": None,
                "amendments": None,
                "source_url": None,
            },
            "regulations": [],
            "certifications": [],
        }

    lifecycle = {
        "status": standard.lifecycle_status or "UNKNOWN",
        "standard_status": standard.status,
        "revision": standard.revision,
        "review_or_reaffirmation": (
            standard.review_or_reaffirmation
        ),
        "amendments": standard.amendments,
        "source_url": standard.source_url,
    }

    certifications = db.scalars(
        select(Certification).where(
            Certification.standard_id == standard.id
        )
    ).all()

    certification_data = []

    for certification in certifications:
        certification_data.append(
            {
                "certification_id": certification.id,
                "scheme_name": certification.scheme_name,
                "product_category": certification.product_category,
                "applicability": certification.applicability,
                "implementation_information": (
                    certification.implementation_information
                ),
                "source_url": certification.source_url,
            }
        )

    standard_notifications = db.scalars(
        select(StandardNotification).where(
            StandardNotification.standard_id == standard.id
        )
    ).all()

    regulation_data = []

    for standard_notification in standard_notifications:
        notification = db.get(
            Notification,
            standard_notification.notification_id,
        )

        if notification is None:
            continue

        regulation_data.append(
            {
                "notification_id": notification.id,
                "notification_number": (
                    notification.notification_number
                ),
                "title": notification.title,
                "date": notification.date,
                "notification_type": (
                    notification.notification_type
                ),
                "relationship": (
                    standard_notification.relationship
                ),
                "implementation_information": (
                    notification.implementation_information
                ),
                "source_url": notification.source_url,
            }
        )

    return {
        "lifecycle": lifecycle,
        "regulations": regulation_data,
        "certifications": certification_data,
    }