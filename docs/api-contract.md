# API Contract

## 1. Purpose

This document defines the data contract between the frontend, backend, AI pipeline, and database.

The main API is:

POST /analyze

The API accepts a product description, technical specification, tender text, or extracted document content and returns:

- extracted requirements
- product classification
- recommended Indian Standards
- related/allied standards
- lifecycle information
- amendments
- regulatory/notification information
- certification information
- confidence
- warnings
- evidence/source information

---

## 2. Important: JSON vs Real Data

JSON is a structured data format used for communication between software components.

In this project, JSON is used mainly for:

1. Frontend → Backend API request
2. Backend → Frontend API response
3. AI module → Backend intermediate results
4. Mock data during frontend/backend development
5. Testing API responses

The JSON examples in this document are ONLY PLACEHOLDERS.

They are NOT actual BIS standards.

Do NOT invent IS numbers, titles, certification requirements, amendments, regulations, or source URLs to fill these examples.

During development, placeholder values may be used to test the software structure.

Later, the placeholders MUST be replaced by real, verified data obtained from the project dataset and authoritative sources such as BIS/CRS/government notifications.

The final demo must use real verified records wherever a real standard is shown.

---

# 3. Text-Only Request

For a normal text query, the frontend sends JSON to:

POST /analyze

Example request:

```json
{
  "text": "PLACEHOLDER USER PRODUCT DESCRIPTION",
  "document": null,
  "language": "en"
}
```

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| text | string | Yes for text input | Product description or technical specification |
| document | null | No | Reserved for document-based requests |
| language | string | Yes | Input language code |

The value `PLACEHOLDER USER PRODUCT DESCRIPTION` is only an example.

The actual user input will be inserted here.

---

# 4. PDF / Document Request

For PDF upload, the frontend sends the file using `multipart/form-data`.

The backend extracts text from the PDF using PyMuPDF.

The extracted text is then passed through the same analysis pipeline.

Conceptually:

```text
PDF
 ↓
PyMuPDF
 ↓
Extracted Text
 ↓
Requirement Extraction
 ↓
Product Normalization
 ↓
Semantic Retrieval
 ↓
Ranking
 ↓
Knowledge Graph
 ↓
Lifecycle Check
 ↓
Regulatory / Certification Check
 ↓
Final JSON Response
```

The frontend does NOT need to construct the entire JSON response.

The backend creates the final response.

---

# 5. Response Top-Level Structure

The successful response has the following structure:

```json
{
  "extracted_requirements": {},
  "product_classification": {},
  "recommended_standards": [],
  "related_standards": [],
  "lifecycle": [],
  "regulations": [],
  "certifications": [],
  "confidence": {},
  "warnings": [],
  "evidence": []
}
```

All fields should be returned even if some contain empty arrays or UNKNOWN values.

---

# 6. extracted_requirements

This section contains the requirements extracted from the user's input.

Example:

```json
{
  "product_type": "PLACEHOLDER_PRODUCT_TYPE",
  "intended_use": "PLACEHOLDER_INTENDED_USE",
  "technical_requirements": [
    {
      "parameter": "PLACEHOLDER_PARAMETER",
      "value": "PLACEHOLDER_VALUE",
      "unit": "PLACEHOLDER_UNIT"
    }
  ],
  "safety_requirements": [
    "PLACEHOLDER_SAFETY_REQUIREMENT"
  ],
  "performance_requirements": [
    "PLACEHOLDER_PERFORMANCE_REQUIREMENT"
  ],
  "environmental_requirements": [
    "PLACEHOLDER_ENVIRONMENTAL_REQUIREMENT"
  ]
}
```

### Purpose

The AI extracts structured requirements from unstructured input.

For example, a sentence such as:

```text
The device should operate at a specified voltage and provide wireless connectivity.
```

would be converted into structured requirements.

The exact values must come from the user's input.

The AI must NOT invent requirements.

---

# 7. product_classification

This section describes the normalized product category.

Example:

```json
{
  "product_name": "PLACEHOLDER_PRODUCT_NAME",
  "normalized_product": "PLACEHOLDER_NORMALIZED_PRODUCT",
  "category": "PLACEHOLDER_CATEGORY",
  "sub_category": "PLACEHOLDER_SUB_CATEGORY",
  "keywords": [
    "PLACEHOLDER_KEYWORD_1",
    "PLACEHOLDER_KEYWORD_2"
  ]
}
```

### Purpose

Different users may describe the same product using different terminology.

The AI converts the description into a normalized representation that can be used for semantic retrieval.

Example concept:

```text
User wording
      ↓
Product normalization
      ↓
Standardized product concept
      ↓
Semantic retrieval
```

---

# 8. recommended_standards

This section contains standards identified as potentially applicable to the product.

Example:

```json
[
  {
    "is_number": "<VERIFIED_IS_NUMBER_FROM_DATASET>",
    "title": "<VERIFIED_STANDARD_TITLE_FROM_DATASET>",
    "scope": "<VERIFIED_SCOPE_FROM_DATASET>",
    "relevance_reason": "PLACEHOLDER_REASON",
    "match_score": 0.0,
    "status": "UNKNOWN",
    "revision": "UNKNOWN",
    "amendments": [],
    "source": "<VERIFIED_SOURCE_URL_FROM_DATASET>"
  }
]
```

IMPORTANT:

`<VERIFIED_IS_NUMBER_FROM_DATASET>` is NOT a real IS number.

It means that the backend must insert an actual verified IS number from the project's database.

Likewise, the title, scope and source must come from verified dataset records.

### match_score

The match score represents semantic/relevance matching produced by the retrieval/ranking pipeline.

The exact scoring implementation can be decided by the AI/backend team.

It must NOT be interpreted as a legal certification or compliance guarantee.

---

# 9. related_standards

This section contains allied standards associated with recommended standards.

Relationship types are explicitly represented.

Allowed relationship types:

- NORMATIVE_REFERENCE
- TEST_METHOD
- SAFETY_STANDARD
- MATERIAL_STANDARD
- RELATED_STANDARD
- SUPERSEDES

Example:

```json
[
  {
    "is_number": "<VERIFIED_RELATED_IS_NUMBER>",
    "title": "<VERIFIED_RELATED_STANDARD_TITLE>",
    "relationship_type": "NORMATIVE_REFERENCE",
    "related_to": "<VERIFIED_PRIMARY_IS_NUMBER>",
    "reason": "PLACEHOLDER_RELATIONSHIP_REASON",
    "source": "<VERIFIED_SOURCE_URL>"
  }
]
```

The relationship must come from the actual dataset or verified source.

Do not infer a relationship merely because two standards appear similar.

---

# 10. lifecycle

This section describes the lifecycle/status of standards.

Allowed lifecycle values:

- CURRENT
- REVISED
- AMENDED
- SUPERSEDED
- WITHDRAWN
- UNKNOWN

Example:

```json
[
  {
    "is_number": "<VERIFIED_IS_NUMBER>",
    "status": "UNKNOWN",
    "revision": "UNKNOWN",
    "review_or_reaffirmation": "UNKNOWN",
    "amendments": [],
    "superseded_by": null,
    "source": "<VERIFIED_BIS_SOURCE_URL>"
  }
]
```

### Important rule

Do NOT determine whether a standard is current merely by looking at the year in its IS number.

Lifecycle must be based on verified BIS lifecycle information or another authoritative source.

If the status cannot be established reliably:

```json
"status": "UNKNOWN"
```

---

# 11. regulations

This section contains relevant regulatory notifications, circulars, orders, or implementation information.

Example:

```json
[
  {
    "notification_number": "<VERIFIED_NOTIFICATION_NUMBER>",
    "title": "<VERIFIED_NOTIFICATION_TITLE>",
    "authority": "<VERIFIED_AUTHORITY>",
    "date": "UNKNOWN",
    "affected_standard": "<VERIFIED_IS_NUMBER>",
    "implementation_information": "PLACEHOLDER_IMPLEMENTATION_INFORMATION",
    "source": "<VERIFIED_NOTIFICATION_SOURCE>"
  }
]
```

No notification number should be invented.

If there is no verified regulatory information:

```json
"regulations": []
```

---

# 12. certifications

This section contains certification or registration information relevant to the product.

Example:

```json
[
  {
    "scheme": "PLACEHOLDER_CERTIFICATION_SCHEME",
    "applicability": "UNKNOWN",
    "product_category": "PLACEHOLDER_PRODUCT_CATEGORY",
    "standard": "<VERIFIED_IS_NUMBER>",
    "implementation_information": "PLACEHOLDER_IMPLEMENTATION_INFORMATION",
    "source": "<VERIFIED_CRS_OR_AUTHORITY_SOURCE>"
  }
]
```

### Important

The system must NOT claim that certification is mandatory unless the dataset contains authoritative evidence supporting that conclusion.

Use:

```json
"applicability": "UNKNOWN"
```

when the information cannot be verified.

---

# 13. confidence

This section summarizes confidence/uncertainty in the system's result.

Example:

```json
{
  "overall": 0.0,
  "classification": 0.0,
  "retrieval": 0.0,
  "explanation": "PLACEHOLDER_CONFIDENCE_EXPLANATION"
}
```

The numerical values are placeholders.

The final implementation should define how confidence is calculated.

Confidence should communicate uncertainty to the user.

It must not be presented as a legal guarantee of compliance.

---

# 14. warnings

Warnings communicate uncertainty, missing information, conflicts, or possible risks.

Example:

```json
[
  "PLACEHOLDER_WARNING"
]
```

Possible real warning categories include:

```text
Ambiguous product description
Insufficient technical information
Multiple potentially applicable standards
Lifecycle status could not be verified
Certification applicability could not be verified
Conflicting requirements detected
No sufficiently reliable standard match
```

These are examples of warning types, not fixed output text.

---

# 15. evidence

Every important recommendation should be traceable to evidence.

Example:

```json
[
  {
    "type": "BIS_STANDARD",
    "reference": "<VERIFIED_IS_NUMBER>",
    "source": "<VERIFIED_SOURCE_URL>",
    "supporting_information": "PLACEHOLDER_SUPPORTING_INFORMATION"
  }
]
```

Other possible evidence types include:

```text
BIS_STANDARD
BIS_CRS
BIS_NOTIFICATION
GOVERNMENT_NOTIFICATION
DATASET_RECORD
```

The frontend should display evidence/source information so that users can understand where the recommendation came from.

---

# 16. Complete Successful Response

The complete response structure is:

```json
{
  "extracted_requirements": {
    "product_type": "PLACEHOLDER_PRODUCT_TYPE",
    "intended_use": "PLACEHOLDER_INTENDED_USE",
    "technical_requirements": [],
    "safety_requirements": [],
    "performance_requirements": [],
    "environmental_requirements": []
  },

  "product_classification": {
    "product_name": "PLACEHOLDER_PRODUCT_NAME",
    "normalized_product": "PLACEHOLDER_NORMALIZED_PRODUCT",
    "category": "PLACEHOLDER_CATEGORY",
    "sub_category": "PLACEHOLDER_SUB_CATEGORY",
    "keywords": []
  },

  "recommended_standards": [],

  "related_standards": [],

  "lifecycle": [],

  "regulations": [],

  "certifications": [],

  "confidence": {
    "overall": 0.0,
    "classification": 0.0,
    "retrieval": 0.0,
    "explanation": "PLACEHOLDER"
  },

  "warnings": [],

  "evidence": []
}
```

This is the structure the frontend should rely on.

---

# 17. Error Response

If the request cannot be processed:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "PLACEHOLDER_ERROR_MESSAGE",
    "details": []
  }
}
```

Possible error codes:

```text
INVALID_INPUT
EMPTY_INPUT
DOCUMENT_PROCESSING_ERROR
UNSUPPORTED_DOCUMENT
INSUFFICIENT_INFORMATION
PROCESSING_ERROR
```

The exact error handling can be expanded later.

---

# 18. Integration Rules

### Rule 1 — Do not change field names without coordination

The frontend, backend and AI modules depend on this contract.

If a field must be changed, inform the Technical Lead before changing it.

### Rule 2 — Do not fabricate standards

Never create fake:

- IS numbers
- titles
- amendments
- notifications
- certification requirements
- source URLs

### Rule 3 — Placeholder data is allowed during development

Example:

```json
{
  "is_number": "<VERIFIED_IS_NUMBER_FROM_DATASET>"
}
```

is acceptable for UI/API development.

It is NOT acceptable to present the placeholder as a real standard.

### Rule 4 — Real data replaces placeholders

Once the dataset team provides verified records, the backend must populate the same JSON structure using those records.

The frontend should not need to change its structure.

### Rule 5 — Preserve UNKNOWN

If authoritative information is unavailable:

```json
"status": "UNKNOWN"
```

or:

```json
"applicability": "UNKNOWN"
```

is preferred over guessing.

### Rule 6 — Preserve evidence

Whenever a recommendation depends on a source, preserve the source/reference in the response.

---

# 19. Frontend Development Rule

The frontend team can start before the backend is complete.

They should create mock JSON using the exact structure in Section 20.

The frontend components should be designed against the response schema.

Later:

```text
MOCK JSON
   ↓
POST /analyze
   ↓
REAL BACKEND RESPONSE
```

The UI should continue working because both use the same contract.

---

# 20. Mock Response

This is ONLY for development/testing.

It contains NO real BIS standard.

Do not interpret any value below as an actual standard.

```json
{
  "extracted_requirements": {
    "product_type": "PLACEHOLDER_PRODUCT_TYPE",
    "intended_use": "PLACEHOLDER_INTENDED_USE",
    "technical_requirements": [
      {
        "parameter": "PLACEHOLDER_PARAMETER",
        "value": "PLACEHOLDER_VALUE",
        "unit": "PLACEHOLDER_UNIT"
      }
    ],
    "safety_requirements": [
      "PLACEHOLDER_SAFETY_REQUIREMENT"
    ],
    "performance_requirements": [
      "PLACEHOLDER_PERFORMANCE_REQUIREMENT"
    ],
    "environmental_requirements": []
  },

  "product_classification": {
    "product_name": "PLACEHOLDER_PRODUCT_NAME",
    "normalized_product": "PLACEHOLDER_NORMALIZED_PRODUCT",
    "category": "PLACEHOLDER_CATEGORY",
    "sub_category": "PLACEHOLDER_SUB_CATEGORY",
    "keywords": [
      "PLACEHOLDER_KEYWORD_1",
      "PLACEHOLDER_KEYWORD_2"
    ]
  },

  "recommended_standards": [
    {
      "is_number": "<VERIFIED_IS_NUMBER_FROM_DATASET>",
      "title": "<VERIFIED_STANDARD_TITLE_FROM_DATASET>",
      "scope": "<VERIFIED_SCOPE_FROM_DATASET>",
      "relevance_reason": "PLACEHOLDER_RELEVANCE_REASON",
      "match_score": 0.0,
      "status": "UNKNOWN",
      "revision": "UNKNOWN",
      "amendments": [],
      "source": "<VERIFIED_SOURCE_URL_FROM_DATASET>"
    }
  ],

  "related_standards": [
    {
      "is_number": "<VERIFIED_RELATED_IS_NUMBER>",
      "title": "<VERIFIED_RELATED_STANDARD_TITLE>",
      "relationship_type": "NORMATIVE_REFERENCE",
      "related_to": "<VERIFIED_PRIMARY_IS_NUMBER>",
      "reason": "PLACEHOLDER_RELATIONSHIP_REASON",
      "source": "<VERIFIED_SOURCE_URL>"
    }
  ],

  "lifecycle": [
    {
      "is_number": "<VERIFIED_IS_NUMBER>",
      "status": "UNKNOWN",
      "revision": "UNKNOWN",
      "review_or_reaffirmation": "UNKNOWN",
      "amendments": [],
      "superseded_by": null,
      "source": "<VERIFIED_BIS_SOURCE_URL>"
    }
  ],

  "regulations": [
    {
      "notification_number": "<VERIFIED_NOTIFICATION_NUMBER>",
      "title": "<VERIFIED_NOTIFICATION_TITLE>",
      "authority": "<VERIFIED_AUTHORITY>",
      "date": "UNKNOWN",
      "affected_standard": "<VERIFIED_IS_NUMBER>",
      "implementation_information": "PLACEHOLDER_IMPLEMENTATION_INFORMATION",
      "source": "<VERIFIED_NOTIFICATION_SOURCE>"
    }
  ],

  "certifications": [
    {
      "scheme": "PLACEHOLDER_CERTIFICATION_SCHEME",
      "applicability": "UNKNOWN",
      "product_category": "PLACEHOLDER_PRODUCT_CATEGORY",
      "standard": "<VERIFIED_IS_NUMBER>",
      "implementation_information": "PLACEHOLDER_IMPLEMENTATION_INFORMATION",
      "source": "<VERIFIED_CRS_OR_AUTHORITY_SOURCE>"
    }
  ],

  "confidence": {
    "overall": 0.0,
    "classification": 0.0,
    "retrieval": 0.0,
    "explanation": "PLACEHOLDER_CONFIDENCE_EXPLANATION"
  },

  "warnings": [
    "PLACEHOLDER_WARNING"
  ],

  "evidence": [
    {
      "type": "DATASET_RECORD",
      "reference": "<VERIFIED_IS_NUMBER>",
      "source": "<VERIFIED_SOURCE_URL>",
      "supporting_information": "PLACEHOLDER_SUPPORTING_INFORMATION"
    }
  ]
}
```

---

# 21. Final Data Flow

```text
FRONTEND
   |
   | JSON / multipart request
   v
FASTAPI BACKEND
   |
   +----> PDF extraction
   |
   +----> AI requirement extraction
   |
   +----> Product normalization
   |
   +----> Semantic retrieval
   |
   +----> PostgreSQL + pgvector
   |
   +----> Knowledge graph relationships
   |
   +----> Lifecycle/amendment lookup
   |
   +----> Regulatory lookup
   |
   +----> Certification lookup
   |
   v
FINAL JSON RESPONSE
   |
   v
FRONTEND
   |
   +---- Requirements
   +---- Recommendations
   +---- Related standards
   +---- Lifecycle
   +---- Certification
   +---- Warnings
   +---- Evidence
   +---- Knowledge graph
```

---

# 22. Contract Ownership

Technical Lead owns the final API contract.

All modules should integrate against this structure.

Changes should be coordinated before merging.