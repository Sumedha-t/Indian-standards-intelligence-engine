from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    Amendment,
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


def get_standard_graph(
    db: Session,
    standard_id: int,
) -> dict:
    """
    Build a knowledge graph around one standard.

    The graph contains:
    - the requested standard
    - connected standards
    - amendments
    - certifications
    - notifications

    Only relationships represented by authoritative database
    records are included.
    """

    standard = db.get(Standard, standard_id)

    if standard is None:
        return {
            "nodes": [],
            "edges": [],
        }

    nodes = []
    edges = []
    node_ids = set()

    def add_node(node_id, node_type, data):
        if node_id in node_ids:
            return

        nodes.append(
            {
                "id": str(node_id),
                "type": node_type,
                "data": data,
            }
        )

        node_ids.add(node_id)

    def add_edge(source, target, relationship):
        edges.append(
            {
                "source": str(source),
                "target": str(target),
                "relationship": relationship,
            }
        )

    # Root standard
    standard_node_id = f"standard:{standard.id}"

    add_node(
        standard_node_id,
        "standard",
        {
            "standard_id": standard.id,
            "is_number": standard.is_number,
            "title": standard.title,
            "lifecycle_status": standard.lifecycle_status,
            "status": standard.status,
            "revision": standard.revision,
            "review_or_reaffirmation": standard.review_or_reaffirmation,
            "amendments": standard.amendments,
            "source_url": standard.source_url,
            "source_type": standard.source_type,
            "evidence_notes": standard.evidence_notes,
        },
    )

    # Standard-to-standard relationships
    relationship_query = select(StandardRelationship).where(
        (
            StandardRelationship.source_standard_id == standard.id
        )
        | (
            StandardRelationship.target_standard_id == standard.id
        )
    )

    relationships = db.scalars(
        relationship_query
    ).all()

    for relationship in relationships:
        relationship_type = relationship.relationship_type

        if relationship_type not in ALLOWED_RELATIONSHIPS:
            continue

        source = db.get(
            Standard,
            relationship.source_standard_id,
        )

        target = db.get(
            Standard,
            relationship.target_standard_id,
        )

        if source is None or target is None:
            continue

        source_node_id = f"standard:{source.id}"
        target_node_id = f"standard:{target.id}"

        add_node(
            source_node_id,
            "standard",
            {
                "standard_id": source.id,
                "is_number": source.is_number,
                "title": source.title,
                "lifecycle_status": source.lifecycle_status,
                "status": source.status,
                "source_url": source.source_url,
            },
        )

        add_node(
            target_node_id,
            "standard",
            {
                "standard_id": target.id,
                "is_number": target.is_number,
                "title": target.title,
                "lifecycle_status": target.lifecycle_status,
                "status": target.status,
                "source_url": target.source_url,
            },
        )

        add_edge(
            source_node_id,
            target_node_id,
            relationship_type,
        )

    # Amendments
    amendments = db.scalars(
        select(Amendment).where(
            Amendment.standard_id == standard.id
        )
    ).all()

    for amendment in amendments:
        amendment_node_id = f"amendment:{amendment.id}"

        add_node(
            amendment_node_id,
            "amendment",
            {
                "amendment_id": amendment.id,
                "amendment_number": amendment.amendment_number,
                "title": amendment.title,
                "date": amendment.date,
                "description": amendment.description,
                "source_url": amendment.source_url,
            },
        )

        add_edge(
            standard_node_id,
            amendment_node_id,
            "AMENDMENT",
        )

    # Certifications
    certifications = db.scalars(
        select(Certification).where(
            Certification.standard_id == standard.id
        )
    ).all()

    for certification in certifications:
        certification_node_id = (
            f"certification:{certification.id}"
        )

        add_node(
            certification_node_id,
            "certification",
            {
                "certification_id": certification.id,
                "scheme_name": certification.scheme_name,
                "product_category": certification.product_category,
                "applicability": certification.applicability,
                "implementation_information": (
                    certification.implementation_information
                ),
                "source_url": certification.source_url,
            },
        )

        add_edge(
            standard_node_id,
            certification_node_id,
            "CERTIFICATION",
        )

    # Notifications linked to this standard
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

        if notification is None:
            continue

        notification_node_id = (
            f"notification:{notification.id}"
        )

        add_node(
            notification_node_id,
            "notification",
            {
                "notification_id": notification.id,
                "notification_number": notification.notification_number,
                "title": notification.title,
                "date": notification.date,
                "notification_type": notification.notification_type,
                "implementation_information": (
                    notification.implementation_information
                ),
                "source_url": notification.source_url,
            },
        )

        add_edge(
            standard_node_id,
            notification_node_id,
            standard_notification.relationship,
        )

    return {
        "nodes": nodes,
        "edges": edges,
    }


def get_graph_for_standards(
    db: Session,
    standard_ids: list[int],
) -> dict:
    """
    Build one combined knowledge graph for multiple standards.

    Each standard graph is generated from authoritative database
    records and then merged without duplicating nodes or edges.
    """

    nodes = []
    edges = []

    node_ids = set()
    edge_keys = set()

    for standard_id in standard_ids:
        graph = get_standard_graph(
            db,
            standard_id,
        )

        for node in graph["nodes"]:
            node_id = node["id"]

            if node_id not in node_ids:
                nodes.append(node)
                node_ids.add(node_id)

        for edge in graph["edges"]:
            edge_key = (
                edge["source"],
                edge["target"],
                edge["relationship"],
            )

            if edge_key not in edge_keys:
                edges.append(edge)
                edge_keys.add(edge_key)

    return {
        "nodes": nodes,
        "edges": edges,
    }