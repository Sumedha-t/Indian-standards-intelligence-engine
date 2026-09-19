from typing import Any


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
    Temporary provider used during development and testing.
    """

    def generate_structured_output(
        self,
        prompt: str,
    ) -> dict[str, Any]:
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        return {
            "product": None,
            "category": None,
            "attributes": {},
            "constraints": {},
            "standards_keywords": [],
        }


_provider = MockLLMProvider()


def generate_structured_output(
    prompt: str,
) -> dict[str, Any]:
    """
    Generate structured output using the currently configured LLM provider.
    """
    return _provider.generate_structured_output(prompt)