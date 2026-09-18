# Data Model

## 1. Purpose

This document defines the database structure for the Indian Standards Intelligence Engine.

Database:

```text
PostgreSQL
```

Vector extension:

```text
pgvector
```

The database stores authoritative/verified project data and the relationships required for semantic retrieval and knowledge-graph traversal.

---

# 2. Main Entities

The prototype uses the following main entities:

```text
products
standards
standard_relationships
amendments
notifications
standard_notifications
certifications
authorities
```

Optional future entity:

```text
test_methods
```

---

# 3. products

Stores normalized product/category information.

Suggested fields:

| Field | Type | Description |
|---|---|---|
| id | UUID / integer | Primary key |
| product_name | TEXT | Product name |
| normalized_product | TEXT | Normalized product description |
| category | TEXT | Product category |
| sub_category | TEXT | Product sub-category |
| description | TEXT | Product description |
| source | TEXT | Source/evidence if applicable |
| embedding | VECTOR | Product embedding |

Example structure:

```text
products
---------
id
product_name
normalized_product
category
sub_category
description
source
embedding
```

Do not populate the database with invented product records.

---

# 4. standards

Stores Indian Standard metadata.

Suggested fields:

| Field | Type | Description |
|---|---|---|
| id | UUID / integer | Primary key |
| is_number | TEXT | Verified IS number |
| title | TEXT | Verified standard title |
| scope | TEXT | Verified scope |
| department | TEXT | BIS department |
| technical_committee | TEXT | Technical committee |
| classification | TEXT | Classification information |
| revision | TEXT | Revision information |
| review_or_reaffirmation | TEXT | Review/reaffirmation information |
| lifecycle_status | TEXT | Lifecycle status |
| source_url | TEXT | Verified source |
| embedding | VECTOR | Standard embedding |

Example structure:

```text
standards
---------
id
is_number
title
scope
department
technical_committee
classification
revision
review_or_reaffirmation
lifecycle_status
source_url
embedding
```

### Lifecycle values

```text
CURRENT
REVISED
AMENDED
SUPERSEDED
WITHDRAWN
UNKNOWN
```

The database should use `UNKNOWN` when the status cannot be established.

---

# 5. Standard Embeddings

The `embedding` field stores a vector representation of the standard.

The embedding may be generated from information such as:

```text
standard title
scope
description
classification
keywords
```

The exact embedding text should be defined by the AI/retrieval developer.

The embedding is used for:

```text
User query
     ↓
Query embedding
     ↓
pgvector similarity search
     ↓
Candidate standards
```

---

# 6. standard_relationships

This table represents knowledge-graph relationships between standards.

Suggested fields:

| Field | Type | Description |
|---|---|---|
| id | UUID / integer | Primary key |
| source_standard_id | FK | Starting standard |
| target_standard_id | FK | Related standard |
| relationship_type | TEXT | Relationship type |
| source | TEXT | Evidence/source |

Structure:

```text
standard_relationships
----------------------
id
source_standard_id
target_standard_id
relationship_type
source
```

---

# 7. Relationship Types

Allowed relationship types:

```text
NORMATIVE_REFERENCE
TEST_METHOD
SAFETY_STANDARD
MATERIAL_STANDARD
RELATED_STANDARD
SUPERSEDES
```

---

# 8. Relationship Direction

For supersession:

```text
NEW STANDARD
     |
     | SUPERSEDES
     v
OLD STANDARD
```

Therefore:

```text
source_standard_id = new standard
target_standard_id = old standard
relationship_type = SUPERSEDES
```

For other relationships:

```text
STANDARD A
     |
     | NORMATIVE_REFERENCE
     v
STANDARD B
```

The source and target should reflect the relationship as established by the verified source.

---

# 9. amendments

Stores amendments associated with standards.

Suggested fields:

| Field | Type | Description |
|---|---|---|
| id | UUID / integer | Primary key |
| standard_id | FK | Associated standard |
| amendment_number | TEXT | Verified amendment identifier |
| title | TEXT | Amendment title |
| date | DATE / TEXT | Amendment date |
| description | TEXT | Amendment details |
| source_url | TEXT | Verified source |

Structure:

```text
amendments
----------
id
standard_id
amendment_number
title
date
description
source_url
```

Do not invent amendment numbers.

---

# 10. notifications

Stores regulatory/circular/implementation information.

Suggested fields:

| Field | Type | Description |
|---|---|---|
| id | UUID / integer | Primary key |
| notification_number | TEXT | Verified notification/circular number |
| title | TEXT | Title |
| date | DATE / TEXT | Date |
| authority_id | FK | Issuing authority |
| notification_type | TEXT | Circular/order/notification/etc. |
| implementation_information | TEXT | Relevant implementation details |
| source_url | TEXT | Verified source |

Structure:

```text
notifications
-------------
id
notification_number
title
date
authority_id
notification_type
implementation_information
source_url
```

---

# 11. standard_notifications

Associates standards with relevant notifications.

Suggested fields:

| Field | Type | Description |
|---|---|---|
| id | UUID / integer | Primary key |
| standard_id | FK | Standard |
| notification_id | FK | Notification |
| relationship | TEXT | Why they are connected |

Structure:

```text
standard_notifications
----------------------
id
standard_id
notification_id
relationship
```

---

# 12. certifications

Stores certification/registration scheme information.

Suggested fields:

| Field | Type | Description |
|---|---|---|
| id | UUID / integer | Primary key |
| scheme_name | TEXT | Certification/registration scheme |
| product_category | TEXT | Applicable product category |
| standard_id | FK | Associated standard |
| applicability | TEXT | APPLICABLE / NOT_ESTABLISHED / etc. |
| implementation_information | TEXT | Relevant information |
| source_url | TEXT | Verified source |

Structure:

```text
certifications
--------------
id
scheme_name
product_category
standard_id
applicability
implementation_information
source_url
```

The exact allowed applicability values can be finalized by the backend team.

Do not create a `MANDATORY` claim unless the source supports it.

---

# 13. authorities

Stores authorities associated with notifications or regulatory information.

Suggested fields:

| Field | Type | Description |
|---|---|---|
| id | UUID / integer | Primary key |
| name | TEXT | Authority name |
| type | TEXT | Authority type |
| source_url | TEXT | Official source |

Structure:

```text
authorities
-----------
id
name
type
source_url
```

---

# 14. Evidence

Evidence can be stored directly in the relevant entity tables through source fields.

Minimum evidence information should include:

```text
source_url
source_type
source_reference
```

Possible source types:

```text
BIS_STANDARD
BIS_CRS
BIS_NOTIFICATION
GOVERNMENT_NOTIFICATION
PROJECT_DATASET
```

The exact implementation may use a separate evidence table later if required.

For the prototype, source fields inside the relevant tables are acceptable.

---

# 15. Product-to-Standard Relationship

Conceptually:

```text
PRODUCT
   |
   | COVERED_BY
   v
STANDARD
```

This can be represented using a product-standard association table if required.

Suggested future table:

```text
product_standards
-----------------
id
product_id
standard_id
relationship
source
```

Possible relationship:

```text
COVERED_BY
```

The backend team can implement this table if the dataset requires explicit product-to-standard mapping.

---

# 16. Complete Knowledge Graph

The complete conceptual graph is:

```text
                         +----------------+
                         |    PRODUCT     |
                         +----------------+
                                  |
                                  | COVERED_BY
                                  v
                         +----------------+
                         |   STANDARD A   |
                         +----------------+
                           /    |    |    \
                          /     |    |     \
                         v      v    v      v
                    NORMATIVE  TEST SAFETY MATERIAL
                    REFERENCE  METHOD STANDARD STANDARD
                         |      |    |      |
                         +------+----+------+
                                |
                                v
                         +----------------+
                         |   STANDARD B   |
                         +----------------+
                                |
                                | SUPERSEDES
                                v
                         +----------------+
                         |   OLD STANDARD|
                         +----------------+

STANDARD A
    |
    | AMENDED_BY
    v
AMENDMENT

STANDARD A
    |
    | REGULATED_BY
    v
NOTIFICATION
    |
    | ISSUED_BY
    v
AUTHORITY

NOTIFICATION
    |
    | REQUIRES
    v
CERTIFICATION_SCHEME
```

---

# 17. Example Relationship Records

The following are structural examples only.

They do NOT contain real standards.

```text
source_standard_id = <STANDARD_ID_A>
target_standard_id = <STANDARD_ID_B>
relationship_type = NORMATIVE_REFERENCE
```

Another example:

```text
source_standard_id = <NEW_STANDARD_ID>
target_standard_id = <OLD_STANDARD_ID>
relationship_type = SUPERSEDES
```

These IDs must later refer to actual database records.

---

# 18. Data Quality Rules

### Rule 1

Every IS number must originate from verified source data.

### Rule 2

Every standard title must originate from verified source data.

### Rule 3

Every lifecycle status must be supported by evidence.

### Rule 4

Every amendment must have a verified source.

### Rule 5

Every notification must have a verified source.

### Rule 6

Certification applicability must have supporting evidence.

### Rule 7

Do not infer mandatory certification from the existence of a standard alone.

### Rule 8

If information is unavailable, store:

```text
UNKNOWN
```

or NULL where appropriate.

### Rule 9

Do not use a fabricated URL.

### Rule 10

Keep source information with every important record.

---

# 19. Prototype Dataset Structure

The prototype target is:

```text
50–100 total standards/product records
```

Of these:

```text
15–20 deeply enriched records
```

Deep records should contain, where available:

```text
Standard metadata
      +
Scope
      +
References
      +
Relationships
      +
Lifecycle
      +
Amendments
      +
Supersession
      +
Regulatory information
      +
Certification information
      +
Source evidence
```

The remaining records can contain a smaller subset of verified fields.

---

# 20. Dataset Storage

Raw source data:

```text
data/raw/
```

Cleaned/processed data:

```text
data/processed/
```

Schema/reference files:

```text
data/schema/
```

Suggested files:

```text
data/
├── raw/
│   ├── bis/
│   ├── crs/
│   └── notifications/
│
├── processed/
│   ├── standards.csv
│   ├── relationships.csv
│   ├── amendments.csv
│   ├── notifications.csv
│   ├── certifications.csv
│   └── authorities.csv
│
└── schema/
    └── data_dictionary.md
```

Actual filenames may be adjusted by the dataset developer.

---

# 21. Data Flow

```text
Official Sources
      |
      v
Raw Data
      |
      v
Cleaning / Normalization
      |
      v
Processed Dataset
      |
      v
PostgreSQL
      |
      +----> Standard Metadata
      |
      +----> Relationships
      |
      +----> Lifecycle
      |
      +----> Amendments
      |
      +----> Notifications
      |
      +----> Certification
      |
      +----> Embeddings
      |
      v
AI Retrieval + Backend
```

---

# 22. Important Prototype Principle

The database is the source of truth for the prototype's standard information.

The AI should retrieve and reason over the stored records.

The AI should NOT generate an IS number from memory.

The final response should always preserve evidence/source information wherever possible.