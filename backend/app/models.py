from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from pgvector.sqlalchemy import Vector

from .database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    product_name = Column(Text, nullable=False)
    normalized_product = Column(Text)
    category = Column(Text)
    sub_category = Column(Text)
    description = Column(Text)
    source = Column(Text)


class Standard(Base):
    __tablename__ = "standards"

    id = Column(Integer, primary_key=True)
    is_number = Column(Text, nullable=False, unique=True)
    title = Column(Text, nullable=False)
    scope = Column(Text)
    department = Column(Text)
    technical_committee = Column(Text)
    classification = Column(Text)
    status = Column(Text)
    revision = Column(Text)
    review_or_reaffirmation = Column(Text)
    amendments = Column(Text)
    lifecycle_status = Column(Text, nullable=False, default="UNKNOWN")
    source_url = Column(Text)
    source_type = Column(Text)
    evidence_notes = Column(Text)
    embedding = Column(Vector(384), nullable=True)


class StandardRelationship(Base):
    __tablename__ = "standard_relationships"

    id = Column(Integer, primary_key=True)

    source_standard_id = Column(
        Integer,
        ForeignKey("standards.id"),
        nullable=False,
    )

    target_standard_id = Column(
        Integer,
        ForeignKey("standards.id"),
        nullable=False,
    )

    relationship_type = Column(Text, nullable=False)
    source = Column(Text)

    source_standard = relationship(
        "Standard",
        foreign_keys=[source_standard_id],
    )

    target_standard = relationship(
        "Standard",
        foreign_keys=[target_standard_id],
    )


class Amendment(Base):
    __tablename__ = "amendments"

    id = Column(Integer, primary_key=True)
    standard_id = Column(
        Integer,
        ForeignKey("standards.id"),
        nullable=False,
    )
    amendment_number = Column(Text)
    title = Column(Text)
    date = Column(Text)
    description = Column(Text)
    source_url = Column(Text)


class Authority(Base):
    __tablename__ = "authorities"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    type = Column(Text)
    source_url = Column(Text)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    notification_number = Column(Text)
    title = Column(Text)
    date = Column(Text)
    authority_id = Column(
        Integer,
        ForeignKey("authorities.id"),
    )
    notification_type = Column(Text)
    implementation_information = Column(Text)
    source_url = Column(Text)


class StandardNotification(Base):
    __tablename__ = "standard_notifications"

    id = Column(Integer, primary_key=True)

    standard_id = Column(
        Integer,
        ForeignKey("standards.id"),
        nullable=False,
    )

    notification_id = Column(
        Integer,
        ForeignKey("notifications.id"),
        nullable=False,
    )

    relationship = Column(Text)


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True)
    scheme_name = Column(Text)
    product_category = Column(Text)

    standard_id = Column(
        Integer,
        ForeignKey("standards.id"),
    )

    applicability = Column(Text)
    implementation_information = Column(Text)
    source_url = Column(Text)