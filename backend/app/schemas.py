from typing import Any, Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: Optional[str] = None
    document: Optional[str] = None
    language: str = "en"


class TechnicalRequirement(BaseModel):
    parameter: str
    value: str
    unit: Optional[str] = None


class ExtractedRequirements(BaseModel):
    product_type: Optional[str] = None
    intended_use: Optional[str] = None
    technical_requirements: list[TechnicalRequirement] = Field(default_factory=list)
    safety_requirements: list[str] = Field(default_factory=list)
    performance_requirements: list[str] = Field(default_factory=list)
    environmental_requirements: list[str] = Field(default_factory=list)


class ProductClassification(BaseModel):
    product_name: Optional[str] = None
    normalized_product: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    keywords: list[str] = Field(default_factory=list)


class RecommendedStandard(BaseModel):
    is_number: str
    title: str
    scope: Optional[str] = None
    relevance_reason: Optional[str] = None
    match_score: Optional[float] = None
    status: str = "UNKNOWN"
    revision: Optional[str] = None
    amendments: list[Any] = Field(default_factory=list)
    source: Optional[str] = None


class RelatedStandard(BaseModel):
    is_number: str
    title: str
    relationship_type: str
    related_to: Optional[str] = None
    reason: Optional[str] = None
    source: Optional[str] = None


class LifecycleRecord(BaseModel):
    is_number: str
    status: str = "UNKNOWN"
    revision: Optional[str] = None
    review_or_reaffirmation: Optional[str] = None
    amendments: list[Any] = Field(default_factory=list)
    superseded_by: Optional[str] = None
    source: Optional[str] = None


class RegulationRecord(BaseModel):
    notification_number: str
    title: str
    authority: Optional[str] = None
    date: Optional[str] = None
    affected_standard: Optional[str] = None
    implementation_information: Optional[str] = None
    source: Optional[str] = None


class CertificationRecord(BaseModel):
    scheme: str
    applicability: str = "UNKNOWN"
    product_category: Optional[str] = None
    standard: Optional[str] = None
    implementation_information: Optional[str] = None
    source: Optional[str] = None


class Confidence(BaseModel):
    overall: float = 0.0
    classification: float = 0.0
    retrieval: float = 0.0
    explanation: str = ""


class EvidenceRecord(BaseModel):
    type: str
    reference: str
    source: Optional[str] = None
    supporting_information: Optional[str] = None


class AnalyzeResponse(BaseModel):
    extracted_requirements: ExtractedRequirements
    product_classification: ProductClassification
    recommended_standards: list[RecommendedStandard] = Field(default_factory=list)
    related_standards: list[RelatedStandard] = Field(default_factory=list)
    lifecycle: list[LifecycleRecord] = Field(default_factory=list)
    regulations: list[RegulationRecord] = Field(default_factory=list)
    certifications: list[CertificationRecord] = Field(default_factory=list)
    confidence: Confidence
    warnings: list[str] = Field(default_factory=list)
    evidence: list[EvidenceRecord] = Field(default_factory=list)