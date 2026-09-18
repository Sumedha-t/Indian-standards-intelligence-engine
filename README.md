# Indian Standards Intelligence Engine

AI-powered recommendation engine for identifying applicable Indian Standards (IS) for procurement specifications.

## Problem Statement

Government departments, PSEs, procurement agencies, and private organizations need to prepare tender and procurement specifications that reference applicable Indian Standards.

The challenge is that relevant standards may be difficult to identify because of:

- Large number of Indian Standards
- Overlapping scopes
- Revisions and amendments
- Normative and allied references
- Multiple applicable standards
- Outdated or superseded standards
- Incomplete or ambiguous procurement requirements
- Multilingual user input

## Objective

Build an AI-powered system that accepts product descriptions, technical specifications, and tender documents and recommends relevant Indian Standards using semantic understanding rather than simple keyword matching.

The system also identifies related standards, checks lifecycle and amendments, maps applicable certification requirements, and provides evidence-backed explanations.

## Core Workflow

User Input
→ Requirement Extraction
→ Product Normalization
→ Product Classification
→ Semantic Retrieval
→ Candidate Standards
→ Relevance Ranking
→ Scope Compatibility
→ Knowledge Graph Traversal
→ Lifecycle & Amendment Check
→ Regulatory / Certification Mapping
→ Explainable Output

## Supported Inputs

- Natural-language product description
- Technical specifications
- Tender PDF
- Multilingual input
- Ambiguous or incomplete requirements

## Expected Output

For each analysis, the system provides:

- Extracted requirements
- Product classification
- Recommended Indian Standards
- Related / normative / test / safety / material standards
- Standard lifecycle status
- Amendments and supersession information
- Regulatory / notification information
- Certification information where applicable
- Confidence and uncertainty
- Evidence and source information

## Prototype Domain

Initial prototype domain:

**Electronics / Information Technology**

The prototype will use a focused dataset of Indian Standards and related BIS/CRS information while keeping the architecture general enough for expansion to additional domains.

## Technology Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Flow

### Backend
- Python
- FastAPI

### Database
- PostgreSQL
- pgvector

### AI / NLP
- LLM API for requirement extraction, normalization, ambiguity detection, and explanation
- Embedding model for semantic retrieval
- Vector similarity search using pgvector

### Document Processing
- PyMuPDF

### Data Processing
- Python
- pandas
- requests
- BeautifulSoup

## Knowledge Graph

The system represents relationships between:

- Products
- Indian Standards
- Amendments
- Regulations / Notifications
- Certification Schemes
- Authorities

Key relationships include:

- Covered By
- Normative Reference
- Test Method
- Safety Standard
- Material Standard
- Related Standard
- Supersedes
- Amended By
- Regulated By
- Requires Certification

## Reliability Principles

The system must:

- Never fabricate an Indian Standard number
- Never claim mandatory certification without supporting evidence
- Never assume the newest year automatically means the current standard
- Preserve authoritative source information
- Explicitly represent uncertainty
- Use `UNKNOWN` / `NULL` when information is unavailable
- Distinguish recommendations from verified regulatory facts

## Repository Structure

```text
indian-standards-intelligence-engine/
│
├── frontend/              # Next.js frontend
├── backend/               # FastAPI backend
├── ai/                    # AI/NLP and retrieval pipeline
├── data/
│   ├── raw/               # Raw source data
│   ├── processed/         # Cleaned/enriched data
│   └── schema/            # Database/data schemas
├── scripts/               # Data ingestion and utility scripts
├── docs/                  # Architecture and technical documentation
├── .gitignore
└── README.md