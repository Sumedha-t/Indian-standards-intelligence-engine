from backend.app.database import Base, engine
from backend.app.models import Product, Standard, StandardRelationship

Base.metadata.create_all(bind=engine)

print("DATABASE TABLES CREATED")