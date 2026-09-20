from typing import Any
import re


class LLMProvider:
    """
    Provider-independent interface for structured LLM generation.
    """

    def generate_structured_output(
        self,
        prompt: str,
    ) -> dict[str, Any]:
        raise NotImplementedError(
            "LLM provider implementation is required."
        )


class MockLLMProvider(LLMProvider):
    """
    Deterministic structured requirement extractor used for the prototype.

    This provides the structured output contract required by the AI pipeline
    without requiring an external LLM API during local development.
    """

    PRODUCT_PATTERNS = {
        "laptop": {
            "product": "laptop computer",
            "category": "information technology equipment",
            "keywords": [
                "laptop",
                "notebook computer",
                "personal computer",
                "information technology equipment",
            ],
        },
        "notebook": {
            "product": "laptop computer",
            "category": "information technology equipment",
            "keywords": [
                "notebook computer",
                "laptop",
                "personal computer",
                "information technology equipment",
            ],
        },
        "desktop": {
            "product": "desktop computer",
            "category": "information technology equipment",
            "keywords": [
                "desktop computer",
                "personal computer",
                "information technology equipment",
            ],
        },
        "computer": {
            "product": "computer",
            "category": "information technology equipment",
            "keywords": [
                "computer",
                "personal computer",
                "information technology equipment",
            ],
        },
        "monitor": {
            "product": "computer monitor",
            "category": "information technology equipment",
            "keywords": [
                "computer monitor",
                "display",
                "information technology equipment",
            ],
        },
        "printer": {
            "product": "printer",
            "category": "office information technology equipment",
            "keywords": [
                "printer",
                "printing equipment",
                "information technology equipment",
            ],
        },
        "router": {
            "product": "network router",
            "category": "networking equipment",
            "keywords": [
                "router",
                "network equipment",
                "telecommunication equipment",
            ],
        },
        "switch": {
            "product": "network switch",
            "category": "networking equipment",
            "keywords": [
                "network switch",
                "network equipment",
            ],
        },
        "server": {
            "product": "server computer",
            "category": "information technology equipment",
            "keywords": [
                "server",
                "computer",
                "information technology equipment",
            ],
        },
    }

    def generate_structured_output(
        self,
        prompt: str,
    ) -> dict[str, Any]:
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        text = self._extract_requirement_text(prompt)

        normalized_text = " ".join(text.lower().split())

        product = None
        category = None
        keywords: list[str] = []

        for pattern, metadata in self.PRODUCT_PATTERNS.items():
            if re.search(rf"\b{re.escape(pattern)}\b", normalized_text):
                product = metadata["product"]
                category = metadata["category"]
                keywords.extend(metadata["keywords"])
                break

        attributes: dict[str, Any] = {}
        constraints: dict[str, Any] = {}

        safety_requirements = []

        if any(
            term in normalized_text
            for term in [
                "electrical safety",
                "electrical",
                "safety requirement",
                "safety requirements",
            ]
        ):
            attributes["safety"] = "electrical safety"
            keywords.extend(
                [
                    "electrical safety",
                    "safety requirements",
                ]
            )

        if "information technology" in normalized_text:
            keywords.append("information technology equipment")

        if "government" in normalized_text:
            constraints["intended_user"] = "government office employees"

        if "office" in normalized_text:
            constraints["intended_environment"] = "office"

        if "standard" in normalized_text:
            constraints["standards_required"] = True

        if "electrical safety" in normalized_text:
            safety_requirements.append("electrical safety")

        # Preserve order while removing duplicates.
        keywords = list(dict.fromkeys(keywords))

        return {
            "product": product,
            "category": category,
            "attributes": attributes,
            "constraints": constraints,
            "standards_keywords": keywords,
            "safety_requirements": safety_requirements,
        }

    @staticmethod
    def _extract_requirement_text(prompt: str) -> str:
        """
        Extract the requirement text from the prompt generated by extractor.py.
        """

        marker = "Requirement:"

        if marker in prompt:
            return prompt.split(marker, 1)[1].strip()

        return prompt.strip()


_provider = MockLLMProvider()


def generate_structured_output(
    prompt: str,
) -> dict[str, Any]:
    """
    Generate structured output using the currently configured LLM provider.
    """

    return _provider.generate_structured_output(prompt)