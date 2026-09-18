# System Architecture

## 1. Project

AI-Powered Recommendation Engine for Identifying Applicable Indian Standards for Procurement Specifications

Problem Statement: SIH 26108

---

# 2. Objective

The system accepts procurement/product information and identifies potentially applicable Indian Standards using semantic understanding rather than simple keyword matching.

The system also provides:

- requirement extraction
- product normalization
- semantic retrieval
- relevance ranking
- related/allied standards
- normative references
- test methods
- safety standards
- material standards
- lifecycle information
- amendments
- supersession
- regulatory notifications
- certification/registration information
- uncertainty handling
- evidence/source traceability

---

# 3. High-Level Architecture

```text
                    USER
                      |
                      v
              +---------------+
              |   FRONTEND    |
              | Next.js / TS  |
              +---------------+
                      |
                      v
              +---------------+
              | INPUT HANDLER |
              +---------------+
                 /         \
                /           \
               v             v
        TEXT INPUT       PDF INPUT
                            |
                            v
                       PyMuPDF
                            |
                            v
                     EXTRACTED TEXT
                            |
                +-----------+
                |
                v
       +----------------------+
       | REQUIREMENT          |
       | EXTRACTION           |
       | LLM / NLP            |
       +----------------------+
                |
                v
       +----------------------+
       | PRODUCT NORMALIZATION|
       +----------------------+
                |
                v
       +----------------------+
       | PRODUCT              |
       | CLASSIFICATION       |
       +----------------------+
                |
                v
       +----------------------+
       | EMBEDDING GENERATION |
       +----------------------+
                |
                v
       +----------------------+
       | PGVECTOR SEMANTIC    |
       | RETRIEVAL            |
       +----------------------+
                |
                v
       +----------------------+
       | RELEVANCE RANKING    |
       +----------------------+
                |
                v
       +----------------------+
       | SCOPE / REQUIREMENT  |
       | COMPATIBILITY CHECK  |
       +----------------------+
                |
                v
       +----------------------+
       | KNOWLEDGE GRAPH      |
       | TRAVERSAL            |
       +----------------------+
                |
                +------------------+
                |                  |
                v                  v
       LIFECYCLE CHECK      REGULATORY /
       AMENDMENT CHECK      CERTIFICATION
                |                  |
                +--------+---------+
                         |
                         v
                +------------------+
                | UNCERTAINTY /    |
                | CONFLICT CHECK   |
                +------------------+
                         |
                         v
                +------------------+
                | EXPLAINABLE      |
                | RESPONSE         |
                +------------------+
                         |
                         v
                      FRONTEND
```

---

# 4. Frontend

Technology:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Flow

Responsibilities:

- accept user input
- accept PDF upload
- select language
- send request to backend
- display loading state
- display errors
- display extracted requirements
- display product classification
- display recommended standards
- display related standards
- display lifecycle
- display amendments
- display certification information
- display warnings
- display evidence
- visualize relationships using React Flow

The frontend should NOT contain authoritative BIS data.

It receives the data from the backend.

---

# 5. Backend

Technology:

- Python
- FastAPI

Responsibilities:

- API handling
- request validation
- PDF processing orchestration
- calling AI modules
- database access
- semantic retrieval orchestration
- knowledge graph traversal
- lifecycle checks
- regulatory checks
- certification checks
- uncertainty handling
- response generation

Main endpoint:

```text
POST /analyze
```

The backend is the main integration layer.

---

# 6. AI Pipeline

The AI pipeline consists of:

```text
Input
  ↓
Requirement Extraction
  ↓
Product Normalization
  ↓
Product Classification
  ↓
Embedding Generation
  ↓
Semantic Retrieval
  ↓
Candidate Standards
  ↓
Relevance Ranking
  ↓
Scope / Requirement Compatibility
  ↓
Confidence / Uncertainty
```

The AI should not directly invent standards.

The AI retrieves candidates from the project database.

Authoritative information such as standard metadata, lifecycle, amendments, notifications, and certification information must come from the stored dataset/evidence.

---

# 7. Semantic Retrieval

The system should not depend only on exact keyword matching.

Example concept:

```text
User:
"network-enabled monitoring device"

        ↓

Product normalization

        ↓

"network-enabled electronic monitoring equipment"

        ↓

Embedding

        ↓

pgvector similarity search

        ↓

Candidate standards

        ↓

Relevance ranking
```

The exact product wording and actual standards will come from real user input and the verified dataset.

---

# 8. Database

Technology:

- PostgreSQL
- pgvector

PostgreSQL stores:

- products
- standards
- standard relationships
- amendments
- notifications
- certifications
- authorities
- evidence/source metadata
- embeddings

pgvector stores embeddings required for semantic retrieval.

A separate vector database is NOT required for the prototype.

---

# 9. Knowledge Graph

The knowledge graph is represented using PostgreSQL relational tables.

Main node types:

```text
PRODUCT
STANDARD
AMENDMENT
NOTIFICATION
CERTIFICATION_SCHEME
AUTHORITY
```

Optional:

```text
TEST_METHOD
```

Relationships:

```text
PRODUCT
   |
   +---- COVERED_BY ----> STANDARD
                              |
                              +---- NORMATIVE_REFERENCE ----> STANDARD
                              |
                              +---- TEST_METHOD -----------> STANDARD
                              |
                              +---- SAFETY_STANDARD -------> STANDARD
                              |
                              +---- MATERIAL_STANDARD -----> STANDARD
                              |
                              +---- RELATED_STANDARD ------> STANDARD
                              |
                              +---- SUPERSEDES ------------> STANDARD
                              |
                              +---- AMENDED_BY ------------> AMENDMENT
                              |
                              +---- REGULATED_BY ----------> NOTIFICATION
                                                               |
                                                               +---- ISSUED_BY ----> AUTHORITY
                                                               |
                                                               +---- REQUIRES -----> CERTIFICATION_SCHEME
```

---

# 10. Explicit Relationship Vocabulary

The following relationship names should be used consistently:

```text
NORMATIVE_REFERENCE
TEST_METHOD
SAFETY_STANDARD
MATERIAL_STANDARD
RELATED_STANDARD
SUPERSEDES
```

The purpose is to make the graph explainable.

For example:

```text
Primary Standard
      |
      +---- NORMATIVE_REFERENCE ----> Related Standard
```

means the relationship comes from a normative reference.

It should not simply be labelled "related" if a more specific relationship is known.

---

# 11. Lifecycle Processing

Lifecycle states:

```text
CURRENT
REVISED
AMENDED
SUPERSEDED
WITHDRAWN
UNKNOWN
```

Lifecycle information should be derived from verified source data.

The system must NOT assume:

```text
highest year = current standard
```

Instead:

```text
Standard metadata
      +
Revision information
      +
Review/reaffirmation information
      +
Amendments
      +
Supersession information
      ↓
Lifecycle status
```

If lifecycle information is unavailable:

```text
UNKNOWN
```

---

# 12. Regulatory Layer

The regulatory layer connects standards/products with:

- BIS notifications
- circulars
- government orders
- implementation information
- relevant authorities

The system should preserve:

- notification number
- date
- authority
- affected standard/product
- implementation information
- source

No regulatory requirement should be generated without supporting evidence.

---

# 13. Certification Layer

The certification layer connects applicable product categories and standards with relevant schemes.

The prototype may include:

- BIS Product Certification
- BIS CRS
- other relevant certification/registration information present in the verified dataset

The system must distinguish between:

```text
Applicable
```

and:

```text
Mandatory
```

A mandatory claim requires authoritative evidence.

If applicability cannot be established:

```text
UNKNOWN
```

---

# 14. Uncertainty Handling

The system must explicitly handle uncertainty.

Examples:

```text
Ambiguous input
       ↓
Ask for / identify missing information

Insufficient information
       ↓
Warning

Multiple possible standards
       ↓
Return multiple candidates with reasons

No reliable match
       ↓
Return no reliable recommendation

Conflicting requirements
       ↓
Warning + explanation

Unknown lifecycle
       ↓
UNKNOWN

Unknown certification applicability
       ↓
UNKNOWN
```

The system must not hide uncertainty.

---

# 15. Evidence-Based Output

Each recommendation should have supporting evidence.

Evidence can include:

```text
BIS standard record
BIS CRS record
BIS notification
Government notification
Verified project dataset record
```

The frontend should expose the evidence to the user.

This allows the system to explain:

```text
Why was this standard recommended?
```

rather than only displaying an IS number.

---

# 16. Prototype Dataset Scope

The prototype will focus on:

```text
Electronics / IT
```

This is a prototype scope.

The architecture should remain general enough to support additional domains later.

Target dataset:

```text
50–100 standards/product records
```

Deeply enriched records:

```text
15–20 records
```

Deep records should include, where available:

- standard metadata
- scope
- references
- relationships
- lifecycle
- amendments
- supersession
- regulatory information
- certification information
- source evidence

---

# 17. End-to-End Processing

```text
USER INPUT
    ↓
INPUT VALIDATION
    ↓
DOCUMENT EXTRACTION
    ↓
REQUIREMENT EXTRACTION
    ↓
PRODUCT NORMALIZATION
    ↓
PRODUCT CLASSIFICATION
    ↓
SEMANTIC EMBEDDING
    ↓
VECTOR RETRIEVAL
    ↓
CANDIDATE STANDARDS
    ↓
RELEVANCE RANKING
    ↓
SCOPE / REQUIREMENT CHECK
    ↓
KNOWLEDGE GRAPH TRAVERSAL
    ↓
LIFECYCLE + AMENDMENT CHECK
    ↓
REGULATORY CHECK
    ↓
CERTIFICATION CHECK
    ↓
UNCERTAINTY / CONFLICT CHECK
    ↓
EVIDENCE GENERATION
    ↓
JSON RESPONSE
    ↓
FRONTEND VISUALIZATION
```

---

# 18. Technology Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
React Flow
```

## Backend

```text
Python
FastAPI
```

## Database

```text
PostgreSQL
pgvector
```

## AI

```text
LLM API
Embedding Model
Semantic Retrieval
Ranking
```

## PDF

```text
PyMuPDF
```

## Data Processing

```text
Python
requests
BeautifulSoup
pandas
```

---

# 19. Deployment Target

Suggested prototype deployment:

```text
Frontend → Vercel
Backend  → Render / Railway
Database → Supabase PostgreSQL
```

The deployment provider can be changed if required.

The architecture must remain:

```text
Frontend
   ↓
Backend API
   ↓
PostgreSQL + pgvector
   ↓
AI / Retrieval / Knowledge Graph
```

---

# 20. Prototype Principles

1. Evidence over guessing.
2. Semantic retrieval over keyword-only matching.
3. Explicit relationships.
4. Lifecycle must be verified.
5. Certification claims require evidence.
6. Unknown information must remain UNKNOWN.
7. No fabricated IS numbers.
8. No fabricated source URLs.
9. No fake regulatory claims.
10. The final system must explain why a recommendation was made.