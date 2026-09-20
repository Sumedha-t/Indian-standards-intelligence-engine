from typing import Any

from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.services.compliance import get_standard_compliance
from backend.app.services.evidence import get_standard_evidence
from backend.app.services.knowledge_graph import (
    get_graph_for_standards,
)

from ai.pipeline import analyze_requirement


LIFECYCLE_VALUES = {
    "CURRENT",
    "REVISED",
    "AMENDED",
    "SUPERSEDED",
    "WITHDRAWN",
    "UNKNOWN",
}


def _normalize_amendments(value: Any) -> list[Any]:
    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, tuple):
        return list(value)

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return []

        return [value]

    return [value]


def _normalize_status(value: Any) -> str:
    if value is None:
        return "UNKNOWN"

    value = str(value).strip()

    if not value:
        return "UNKNOWN"

    value_upper = value.upper()

    if value_upper in LIFECYCLE_VALUES:
        return value_upper

    return value


def _parse_graph_standard_id(
    node_id: Any,
) -> int | None:
    if node_id is None:
        return None

    text = str(node_id).strip()

    if not text:
        return None

    if text.startswith("standard:"):
        text = text.split(
            "standard:",
            1,
        )[1]

    try:
        return int(text)
    except (TypeError, ValueError):
        return None


def _select_graph_seed_ids(
    ranked_candidates: list[dict],
) -> set[int]:
    """
    Use ONLY the strongest recommendation as the graph root.

    The knowledge graph is intended to explain the selected
    recommendation and its directly connected standards.

    Using every competitive recommendation as a graph root causes
    unrelated battery, power-supply, test, and secondary relationships
    to flood the related_standards response.

    Therefore:
        top recommendation -> graph root
        direct graph neighbors -> related standards
    """

    for candidate in ranked_candidates:
        standard_id = candidate.get("standard_id")

        if standard_id is None:
            continue

        try:
            return {int(standard_id)}
        except (TypeError, ValueError):
            continue

    return set()


def _build_related_standards(
    graph: dict,
    seed_standard_ids: set[int],
) -> list[dict]:
    """
    Convert DIRECT graph relationships of the selected recommendation
    into API-level related-standard records.

    Only edges where the root standard is one endpoint are returned.

    This deliberately prevents second-order traversal such as:

        Root
          -> Standard A
              -> Standard B
                  -> Standard C

    from appearing in the immediate related_standards response.

    The graph service may store an edge in either direction. The
    returned API record always normalizes it so that:

        related_to = selected/recommended root standard
        is_number  = directly connected standard
    """

    if not graph:
        return []

    if not seed_standard_ids:
        return []

    nodes = graph.get(
        "nodes",
        [],
    )

    edges = graph.get(
        "edges",
        [],
    )

    if not edges:
        return []

    node_by_id: dict[str, dict] = {}

    for node in nodes:
        node_id = str(
            node.get(
                "id",
                "",
            )
        )

        if node_id:
            node_by_id[node_id] = node

    related: list[dict] = []
    seen: set[tuple] = set()

    allowed_relationships = {
        "NORMATIVE_REFERENCE",
        "TEST_METHOD",
        "SAFETY_STANDARD",
        "MATERIAL_STANDARD",
        "RELATED_STANDARD",
        "SUPERSEDES",
    }

    for edge in edges:
        source_id = str(
            edge.get(
                "source",
                "",
            )
        )

        target_id = str(
            edge.get(
                "target",
                "",
            )
        )

        source_standard_id = _parse_graph_standard_id(
            source_id
        )

        target_standard_id = _parse_graph_standard_id(
            target_id
        )

        if (
            source_standard_id is None
            or target_standard_id is None
        ):
            continue

        # -----------------------------------------------------
        # ONLY DIRECT RELATIONSHIPS OF THE SELECTED ROOT
        # -----------------------------------------------------

        source_is_root = (
            source_standard_id in seed_standard_ids
        )

        target_is_root = (
            target_standard_id in seed_standard_ids
        )

        if not source_is_root and not target_is_root:
            continue

        # -----------------------------------------------------
        # DETERMINE ROOT / RELATED DIRECTION
        # -----------------------------------------------------

        if source_is_root:
            root_standard_id = source_standard_id
            related_standard_id = target_standard_id
            root_node_id = source_id
            related_node_id = target_id

        else:
            root_standard_id = target_standard_id
            related_standard_id = source_standard_id
            root_node_id = target_id
            related_node_id = source_id

        # Avoid self relationships.
        if root_standard_id == related_standard_id:
            continue

        relationship = (
            edge.get("relationship")
            or edge.get("relationship_type")
            or edge.get("type")
        )

        if relationship is None:
            continue

        relationship = str(
            relationship
        ).strip().upper()

        if relationship not in allowed_relationships:
            continue

        root_node = node_by_id.get(
            root_node_id,
            {},
        )

        related_node = node_by_id.get(
            related_node_id,
            {},
        )

        root_data = root_node.get(
            "data",
            {},
        )

        related_data = related_node.get(
            "data",
            {},
        )

        root_is_number = (
            root_data.get(
                "is_number"
            )
            or root_data.get(
                "standard_number"
            )
        )

        related_is_number = (
            related_data.get(
                "is_number"
            )
            or related_data.get(
                "standard_number"
            )
        )

        related_title = (
            related_data.get(
                "title"
            )
            or ""
        )

        if not root_is_number:
            continue

        if not related_is_number:
            continue

        # -----------------------------------------------------
        # NORMALIZED DEDUPLICATION
        # -----------------------------------------------------

        key = (
            str(root_is_number),
            str(related_is_number),
            relationship,
        )

        if key in seen:
            continue

        seen.add(key)

        # -----------------------------------------------------
        # SOURCE
        # -----------------------------------------------------

        source = related_data.get(
            "source_url"
        )

        if not source:
            source = related_data.get(
                "source"
            )

        # -----------------------------------------------------
        # EXPLANATION
        # -----------------------------------------------------

        reason_map = {
            "NORMATIVE_REFERENCE": (
                "Normative reference directly connected "
                "to the recommended standard."
            ),
            "TEST_METHOD": (
                "Test method standard directly connected "
                "to the recommended standard."
            ),
            "SAFETY_STANDARD": (
                "Safety standard directly connected "
                "to the recommended standard."
            ),
            "MATERIAL_STANDARD": (
                "Material standard directly connected "
                "to the recommended standard."
            ),
            "RELATED_STANDARD": (
                "Related standard directly connected "
                "to the recommended standard."
            ),
            "SUPERSEDES": (
                "Supersession relationship directly connected "
                "to the recommended standard."
            ),
        }

        related.append(
            {
                "is_number": str(
                    related_is_number
                ),
                "title": str(
                    related_title
                ),
                "relationship_type": relationship,
                "related_to": str(
                    root_is_number
                ),
                "reason": reason_map.get(
                    relationship,
                    "Directly connected standard identified "
                    "from the knowledge graph.",
                ),
                "source": source,
            }
        )

    return related


def _build_lifecycle_record(
    standard_number: str,
    compliance: dict,
) -> dict:
    lifecycle = (
        compliance.get(
            "lifecycle",
            {},
        )
        if compliance
        else {}
    )

    status = _normalize_status(
        lifecycle.get(
            "status"
        )
    )

    return {
        "is_number": standard_number,
        "status": status,
        "revision": lifecycle.get(
            "revision"
        ),
        "review_or_reaffirmation": lifecycle.get(
            "review_or_reaffirmation"
        ),
        "amendments": _normalize_amendments(
            lifecycle.get(
                "amendments"
            )
        ),
        "superseded_by": lifecycle.get(
            "superseded_by"
        ),
        "source": lifecycle.get(
            "source_url"
        ),
    }


def _build_regulation_records(
    compliance: dict,
) -> list[dict]:
    records: list[dict] = []

    for regulation in (
        compliance.get(
            "regulations",
            []
        )
        if compliance
        else []
    ):
        records.append(
            {
                "notification_number": (
                    regulation.get(
                        "notification_number"
                    )
                    or regulation.get(
                        "notification_id"
                    )
                    or "UNKNOWN"
                ),
                "title": (
                    regulation.get(
                        "title"
                    )
                    or ""
                ),
                "authority": regulation.get(
                    "authority"
                ),
                "date": regulation.get(
                    "date"
                ),
                "affected_standard": regulation.get(
                    "affected_standard"
                ),
                "implementation_information": (
                    regulation.get(
                        "implementation_information"
                    )
                ),
                "source": (
                    regulation.get(
                        "source"
                    )
                    or regulation.get(
                        "source_url"
                    )
                ),
            }
        )

    return records


def _build_certification_records(
    compliance: dict,
    standard_number: str,
) -> list[dict]:
    records: list[dict] = []

    for certification in (
        compliance.get(
            "certifications",
            []
        )
        if compliance
        else []
    ):
        applicability = (
            certification.get(
                "applicability"
            )
            or "UNKNOWN"
        )

        records.append(
            {
                "scheme": (
                    certification.get(
                        "scheme"
                    )
                    or certification.get(
                        "scheme_name"
                    )
                    or "UNKNOWN"
                ),
                "applicability": str(
                    applicability
                ),
                "product_category": certification.get(
                    "product_category"
                ),
                "standard": (
                    certification.get(
                        "standard"
                    )
                    or standard_number
                ),
                "implementation_information": (
                    certification.get(
                        "implementation_information"
                    )
                ),
                "source": (
                    certification.get(
                        "source"
                    )
                    or certification.get(
                        "source_url"
                    )
                ),
            }
        )

    return records


def _build_evidence_records(
    evidence: list[dict],
) -> list[dict]:
    records: list[dict] = []

    for item in evidence:
        if not item:
            continue

        reference = item.get(
            "reference"
        )

        if not reference:
            continue

        records.append(
            {
                "type": item.get(
                    "type",
                    "UNKNOWN",
                ),
                "reference": str(
                    reference
                ),
                "source": item.get(
                    "source"
                ),
                "supporting_information": item.get(
                    "supporting_information"
                ),
            }
        )

    return records


def analyze_text(
    text: str,
    language: str = "en",
):
    if not text or not text.strip():
        raise ValueError(
            "Text input cannot be empty."
        )

    text = text.strip()

    pipeline_result = analyze_requirement(
        query=text,
        top_k=10,
    )

    extracted = (
        pipeline_result.get(
            "extracted_requirements",
            {},
        )
    )

    normalized = (
        pipeline_result.get(
            "normalized_requirements",
            {},
        )
    )

    ranked_candidates = (
        pipeline_result.get(
            "recommended_standards",
            [],
        )
    )

    uncertainty = (
        pipeline_result.get(
            "uncertainty",
            {},
        )
    )

    # ---------------------------------------------------------
    # DATABASE / GRAPH / COMPLIANCE
    # ---------------------------------------------------------

    lifecycle_records = []
    regulation_records = []
    certification_records = []
    evidence_records = []
    warnings: list[str] = []

    # IMPORTANT:
    # Only the strongest recommendation becomes the graph root.
    graph_seed_ids = _select_graph_seed_ids(
        ranked_candidates
    )

    graph = {
        "nodes": [],
        "edges": [],
    }

    with SessionLocal() as db:

        if graph_seed_ids:
            graph = get_graph_for_standards(
                db,
                list(graph_seed_ids),
            )

        # Compliance/evidence are still collected for every
        # recommended standard.
        for candidate in ranked_candidates:

            standard_id = candidate.get(
                "standard_id"
            )

            standard_number = (
                candidate.get(
                    "is_number"
                )
                or "UNKNOWN"
            )

            if standard_id is None:
                continue

            compliance = get_standard_compliance(
                db,
                int(standard_id),
            )

            lifecycle_records.append(
                _build_lifecycle_record(
                    standard_number,
                    compliance,
                )
            )

            regulation_records.extend(
                _build_regulation_records(
                    compliance
                )
            )

            certification_records.extend(
                _build_certification_records(
                    compliance,
                    standard_number,
                )
            )

            evidence_records.extend(
                _build_evidence_records(
                    get_standard_evidence(
                        db,
                        int(standard_id),
                    )
                )
            )

    # ---------------------------------------------------------
    # RECOMMENDED STANDARDS
    # ---------------------------------------------------------

    recommended_standards = []

    lifecycle_by_standard = {
        record["is_number"]: record
        for record in lifecycle_records
    }

    for candidate in ranked_candidates:

        standard_number = (
            candidate.get(
                "is_number"
            )
            or "UNKNOWN"
        )

        lifecycle = lifecycle_by_standard.get(
            standard_number,
            {},
        )

        amendments = _normalize_amendments(
            lifecycle.get(
                "amendments"
            )
        )

        source = candidate.get(
            "source"
        )

        if not source:
            source = lifecycle.get(
                "source"
            )

        recommended_standards.append(
            {
                "is_number": standard_number,
                "title": (
                    candidate.get(
                        "title"
                    )
                    or ""
                ),
                "scope": candidate.get(
                    "scope"
                ),
                "relevance_reason": (
                    "Semantic retrieval and requirement "
                    "compatibility analysis identified this "
                    "standard as relevant."
                ),
                "match_score": round(
                    float(
                        candidate.get(
                            "final_score",
                            candidate.get(
                                "score",
                                0.0,
                            ),
                        )
                    ),
                    6,
                ),
                "status": _normalize_status(
                    lifecycle.get(
                        "status"
                    )
                    or candidate.get(
                        "lifecycle_status"
                    )
                ),
                "revision": (
                    lifecycle.get(
                        "revision"
                    )
                    or candidate.get(
                        "revision"
                    )
                ),
                "amendments": amendments,
                "source": source,
            }
        )

        if (
            _normalize_status(
                lifecycle.get(
                    "status"
                )
            )
            == "UNKNOWN"
        ):
            warnings.append(
                f"Lifecycle status for "
                f"{standard_number} is UNKNOWN; "
                "current applicability was not inferred."
            )

        if not candidate.get(
            "scope"
        ) or str(
            candidate.get(
                "scope"
            )
        ).strip().upper() == "UNKNOWN":
            warnings.append(
                f"Scope information for "
                f"{standard_number} is unavailable."
            )

        if not candidate.get(
            "classification"
        ) or str(
            candidate.get(
                "classification"
            )
        ).strip().upper() == "UNKNOWN":
            warnings.append(
                f"Classification information for "
                f"{standard_number} is unavailable."
            )

    # ---------------------------------------------------------
    # RELATED STANDARDS
    # ---------------------------------------------------------

    related_standards = _build_related_standards(
        graph,
        graph_seed_ids,
    )

    # ---------------------------------------------------------
    # REMOVE DUPLICATES
    # ---------------------------------------------------------

    unique_regulations = []
    seen_regulations = set()

    for regulation in regulation_records:
        key = (
            regulation.get(
                "notification_number"
            ),
            regulation.get(
                "title"
            ),
        )

        if key in seen_regulations:
            continue

        seen_regulations.add(key)
        unique_regulations.append(
            regulation
        )

    unique_certifications = []
    seen_certifications = set()

    for certification in certification_records:
        key = (
            certification.get(
                "scheme"
            ),
            certification.get(
                "standard"
            ),
        )

        if key in seen_certifications:
            continue

        seen_certifications.add(key)
        unique_certifications.append(
            certification
        )

    unique_evidence = []
    seen_evidence = set()

    for evidence in evidence_records:
        key = (
            evidence.get(
                "type"
            ),
            evidence.get(
                "reference"
            ),
            evidence.get(
                "source"
            ),
        )

        if key in seen_evidence:
            continue

        seen_evidence.add(key)
        unique_evidence.append(
            evidence
        )

    # ---------------------------------------------------------
    # CONFIDENCE
    # ---------------------------------------------------------

    top_score = float(
        uncertainty.get(
            "top_score"
        )
        or 0.0
    )

    classification_confidence = 0.0

    if normalized.get(
        "product"
    ):
        classification_confidence += 0.5

    if normalized.get(
        "category"
    ):
        classification_confidence += 0.3

    if normalized.get(
        "standards_keywords"
    ):
        classification_confidence += 0.2

    classification_confidence = min(
        1.0,
        classification_confidence,
    )

    retrieval_confidence = max(
        0.0,
        min(
            1.0,
            top_score,
        ),
    )

    overall_confidence = max(
        0.0,
        min(
            1.0,
            (
                classification_confidence
                + retrieval_confidence
            )
            / 2.0,
        ),
    )

    confidence_explanation = (
        uncertainty.get(
            "reason"
        )
        or "Confidence is based on product classification, "
        "semantic retrieval, compatibility scoring, and "
        "uncertainty analysis."
    )

    # ---------------------------------------------------------
    # WARNINGS
    # ---------------------------------------------------------

    uncertainty_status = uncertainty.get(
        "status"
    )

    if uncertainty_status == "AMBIGUOUS":
        warnings.append(
            "Multiple standards have similar relevance scores; "
            "additional product or technical details may be "
            "required to determine the most applicable standard."
        )

    elif uncertainty_status == "INSUFFICIENT_MATCH":
        warnings.append(
            "The strongest retrieved standard has insufficient "
            "relevance to the supplied requirement."
        )

    elif uncertainty_status == "NO_MATCH":
        warnings.append(
            "No reliable standard match was identified."
        )

    if not extracted:
        warnings.append(
            "Requirement extraction returned limited information."
        )

    # Preserve order while removing duplicates.
    warnings = list(
        dict.fromkeys(
            warning
            for warning in warnings
            if warning
        )
    )

    # ---------------------------------------------------------
    # API RESPONSE OBJECT
    # ---------------------------------------------------------

    from backend.app.schemas import (
        AnalyzeResponse,
        CertificationRecord,
        Confidence,
        EvidenceRecord,
        ExtractedRequirements,
        LifecycleRecord,
        ProductClassification,
        RecommendedStandard,
        RegulationRecord,
        RelatedStandard,
        TechnicalRequirement,
    )

    technical_requirements = []

    for requirement in extracted.get(
        "technical_requirements",
        [],
    ):
        if isinstance(
            requirement,
            dict,
        ):
            technical_requirements.append(
                TechnicalRequirement(
                    parameter=str(
                        requirement.get(
                            "parameter",
                            "",
                        )
                    ),
                    value=str(
                        requirement.get(
                            "value",
                            "",
                        )
                    ),
                    unit=requirement.get(
                        "unit"
                    ),
                )
            )

    extracted_requirements = (
        ExtractedRequirements(
            product_type=(
                extracted.get(
                    "product_type"
                )
                or normalized.get(
                    "product"
                )
            ),
            intended_use=(
                extracted.get(
                    "intended_use"
                )
                or normalized.get(
                    "constraints",
                    {},
                ).get(
                    "intended_user"
                )
            ),
            technical_requirements=technical_requirements,
            safety_requirements=(
                extracted.get(
                    "safety_requirements",
                    []
                )
                or normalized.get(
                    "safety_requirements",
                    []
                )
            ),
            performance_requirements=extracted.get(
                "performance_requirements",
                [],
            ),
            environmental_requirements=extracted.get(
                "environmental_requirements",
                [],
            ),
        )
    )

    product_classification = (
        ProductClassification(
            product_name=(
                normalized.get(
                    "product"
                )
            ),
            normalized_product=(
                normalized.get(
                    "product"
                )
            ),
            category=(
                normalized.get(
                    "category"
                )
            ),
            sub_category=None,
            keywords=(
                normalized.get(
                    "standards_keywords",
                    []
                )
            ),
        )
    )

    recommended_models = [
        RecommendedStandard(
            is_number=item["is_number"],
            title=item["title"],
            scope=item["scope"],
            relevance_reason=item[
                "relevance_reason"
            ],
            match_score=item[
                "match_score"
            ],
            status=item["status"],
            revision=item["revision"],
            amendments=item["amendments"],
            source=item["source"],
        )
        for item in recommended_standards
    ]

    related_models = [
        RelatedStandard(
            is_number=item["is_number"],
            title=item["title"],
            relationship_type=item[
                "relationship_type"
            ],
            related_to=item[
                "related_to"
            ],
            reason=item[
                "reason"
            ],
            source=item[
                "source"
            ],
        )
        for item in related_standards
    ]

    lifecycle_models = [
        LifecycleRecord(
            is_number=item["is_number"],
            status=item["status"],
            revision=item["revision"],
            review_or_reaffirmation=item[
                "review_or_reaffirmation"
            ],
            amendments=item["amendments"],
            superseded_by=item[
                "superseded_by"
            ],
            source=item["source"],
        )
        for item in lifecycle_records
    ]

    regulation_models = [
        RegulationRecord(
            notification_number=item[
                "notification_number"
            ],
            title=item["title"],
            authority=item["authority"],
            date=item["date"],
            affected_standard=item[
                "affected_standard"
            ],
            implementation_information=item[
                "implementation_information"
            ],
            source=item["source"],
        )
        for item in unique_regulations
    ]

    certification_models = [
        CertificationRecord(
            scheme=item["scheme"],
            applicability=item[
                "applicability"
            ],
            product_category=item[
                "product_category"
            ],
            standard=item[
                "standard"
            ],
            implementation_information=item[
                "implementation_information"
            ],
            source=item["source"],
        )
        for item in unique_certifications
    ]

    evidence_models = [
        EvidenceRecord(
            type=item["type"],
            reference=item["reference"],
            source=item["source"],
            supporting_information=item[
                "supporting_information"
            ],
        )
        for item in unique_evidence
    ]

    confidence = Confidence(
        overall=round(
            overall_confidence,
            6,
        ),
        classification=round(
            classification_confidence,
            6,
        ),
        retrieval=round(
            retrieval_confidence,
            6,
        ),
        explanation=confidence_explanation,
    )

    return AnalyzeResponse(
        extracted_requirements=(
            extracted_requirements
        ),
        product_classification=(
            product_classification
        ),
        recommended_standards=(
            recommended_models
        ),
        related_standards=(
            related_models
        ),
        lifecycle=(
            lifecycle_models
        ),
        regulations=(
            regulation_models
        ),
        certifications=(
            certification_models
        ),
        confidence=confidence,
        warnings=warnings,
        evidence=evidence_models,
    )