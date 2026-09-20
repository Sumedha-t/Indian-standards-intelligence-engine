from typing import Any


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""

    if isinstance(value, list):
        return " ".join(_normalize_text(item) for item in value)

    if isinstance(value, dict):
        return " ".join(
            f"{key} {_normalize_text(item)}"
            for key, item in value.items()
        )

    return str(value).lower()


def _contains_any(text: str, terms: list[str]) -> bool:
    return any(term in text for term in terms)


def _candidate_compatibility(
    candidate,
    normalized_requirements=None,
) -> float:
    """
    Conservative requirement-to-standard compatibility scoring.

    Ranking hierarchy:

    1. Direct product-specific standards
    2. Product-family standards
    3. Direct safety / energy / networking standards
    4. Supporting component standards
    5. Generic or unrelated standards

    Semantic retrieval remains the primary signal.
    Compatibility only adjusts the semantic score.
    """

    if not normalized_requirements:
        return 0.0

    product = _normalize_text(
        normalized_requirements.get("product")
    )
    category = _normalize_text(
        normalized_requirements.get("category")
    )
    attributes = _normalize_text(
        normalized_requirements.get("attributes")
    )
    constraints = _normalize_text(
        normalized_requirements.get("constraints")
    )
    keywords = _normalize_text(
        normalized_requirements.get("standards_keywords", [])
    )
    safety_requirements = _normalize_text(
        normalized_requirements.get("safety_requirements")
    )
    raw_text = _normalize_text(
        normalized_requirements.get("raw_text")
    )

    requirement_text = " ".join(
        part
        for part in [
            raw_text,
            product,
            category,
            attributes,
            constraints,
            keywords,
            safety_requirements,
        ]
        if part
    )

    title = _normalize_text(candidate.get("title"))
    scope = _normalize_text(candidate.get("scope"))
    classification = _normalize_text(
        candidate.get("classification")
    )

    candidate_text = " ".join(
        part
        for part in [
            title,
            scope,
            classification,
        ]
        if part
        and part not in {
            "unknown",
            "none",
            "null",
        }
    )

    if not candidate_text:
        return 0.0

    score = 0.0

    # ------------------------------------------------------------------
    # PRODUCT FAMILIES
    # ------------------------------------------------------------------

    laptop_terms = [
        "laptop",
        "laptops",
        "notebook computer",
        "notebook computers",
        "notebook",
        "notebooks",
        "portable computer",
        "portable computers",
    ]

    desktop_terms = [
        "desktop computer",
        "desktop computers",
        "desktop",
        "desktops",
    ]

    personal_computer_terms = [
        "personal computer",
        "personal computers",
        "personal computer specification",
    ]

    computer_family_terms = [
        "computer",
        "computers",
        "information technology equipment",
        "information technology",
        "desktop and notebook",
        "desktop and notebook computers",
    ]

    monitor_terms = [
        "computer monitor",
        "computer monitors",
        "monitor",
        "monitors",
        "display",
        "displays",
    ]

    printer_terms = [
        "printer",
        "printers",
        "printing equipment",
        "printing device",
        "printing devices",
    ]

    router_terms = [
        "router",
        "routers",
        "network router",
        "network routers",
        "networking equipment",
        "network equipment",
    ]

    switch_terms = [
        "network switch",
        "network switches",
        "switch",
        "switches",
    ]

    server_terms = [
        "server computer",
        "server computers",
        "server",
        "servers",
    ]

    led_lamp_terms = [
        "led lamp",
        "led lamps",
        "ledlamp",
        "ledlamps",
        "lamp",
        "lamps",
        "lighting",
        "general lighting",
    ]

    battery_terms = [
        "battery",
        "batteries",
        "secondary cell",
        "secondary cells",
        "secondary battery",
        "secondary batteries",
        "lithium-ion battery",
        "lithium ion battery",
        "lithium-ion batteries",
        "lithium ion batteries",
    ]

    nuclear_terms = [
        "nuclear reactor",
        "nuclear reactor instrumentation",
        "nuclear instrumentation",
        "reactor instrumentation",
        "reactor instrumentation and control",
        "nuclear instrumentation and control",
    ]

    power_supply_terms = [
        "power supply",
        "power supplies",
        "dc power supply",
        "dc power supplies",
    ]

    charger_terms = [
        "charger",
        "chargers",
        "battery charger",
        "battery chargers",
    ]

    adapter_terms = [
        "adapter",
        "adapters",
        "power adapter",
        "power adapters",
    ]

    energy_terms = [
        "energy consumption",
        "energy efficiency",
        "energy performance",
    ]

    safety_terms = [
        "safety",
        "electrical safety",
        "safety requirement",
        "safety requirements",
    ]

    product_family = None

    if _contains_any(product, laptop_terms):
        product_family = "laptop"

    elif _contains_any(product, desktop_terms):
        product_family = "desktop"

    elif _contains_any(product, personal_computer_terms):
        product_family = "personal_computer"

    elif _contains_any(product, monitor_terms):
        product_family = "monitor"

    elif _contains_any(product, printer_terms):
        product_family = "printer"

    elif _contains_any(product, router_terms):
        product_family = "router"

    elif _contains_any(product, switch_terms):
        product_family = "switch"

    elif _contains_any(product, server_terms):
        product_family = "server"

    elif _contains_any(product, led_lamp_terms):
        product_family = "led_lamp"

    elif _contains_any(product, battery_terms):
        product_family = "battery"

    elif _contains_any(product, nuclear_terms):
        product_family = "nuclear"

    elif _contains_any(product, power_supply_terms):
        product_family = "power_supply"

    elif _contains_any(product, charger_terms):
        product_family = "charger"

    elif _contains_any(product, adapter_terms):
        product_family = "adapter"

    # Fallback to original requirement text.
    if product_family is None:

        if _contains_any(requirement_text, nuclear_terms):
            product_family = "nuclear"

        elif _contains_any(requirement_text, laptop_terms):
            product_family = "laptop"

        elif _contains_any(requirement_text, desktop_terms):
            product_family = "desktop"

        elif _contains_any(requirement_text, monitor_terms):
            product_family = "monitor"

        elif _contains_any(requirement_text, printer_terms):
            product_family = "printer"

        elif _contains_any(requirement_text, router_terms):
            product_family = "router"

        elif _contains_any(requirement_text, switch_terms):
            product_family = "switch"

        elif _contains_any(requirement_text, server_terms):
            product_family = "server"

        elif _contains_any(requirement_text, led_lamp_terms):
            product_family = "led_lamp"

        elif _contains_any(requirement_text, battery_terms):
            product_family = "battery"

        elif _contains_any(requirement_text, power_supply_terms):
            product_family = "power_supply"

        elif _contains_any(requirement_text, charger_terms):
            product_family = "charger"

        elif _contains_any(requirement_text, adapter_terms):
            product_family = "adapter"

    # ------------------------------------------------------------------
    # DIRECT PRODUCT MATCHES
    # ------------------------------------------------------------------

    if product_family == "laptop":

        if _contains_any(candidate_text, laptop_terms):
            score += 0.10

        elif _contains_any(
            candidate_text,
            [
                "desktop and notebook",
                "desktop and notebook computers",
            ],
        ):
            score += 0.09

        elif _contains_any(
            candidate_text,
            personal_computer_terms,
        ):
            score += 0.07

        elif _contains_any(
            candidate_text,
            computer_family_terms,
        ):
            score += 0.03

    elif product_family == "desktop":

        if _contains_any(candidate_text, desktop_terms):
            score += 0.10

        elif _contains_any(
            candidate_text,
            [
                "desktop and notebook",
                "desktop and notebook computers",
            ],
        ):
            score += 0.09

        elif _contains_any(
            candidate_text,
            personal_computer_terms,
        ):
            score += 0.07

        elif _contains_any(
            candidate_text,
            computer_family_terms,
        ):
            score += 0.03

    elif product_family == "personal_computer":

        if _contains_any(
            candidate_text,
            personal_computer_terms,
        ):
            score += 0.10

        elif _contains_any(
            candidate_text,
            computer_family_terms,
        ):
            score += 0.04

    elif product_family == "monitor":

        if _contains_any(candidate_text, monitor_terms):
            score += 0.10

        elif _contains_any(
            candidate_text,
            [
                "information technology equipment",
                "information technology",
            ],
        ):
            score += 0.05

        elif _contains_any(
            candidate_text,
            personal_computer_terms,
        ):
            score += 0.02

    elif product_family == "printer":

        if _contains_any(candidate_text, printer_terms):
            score += 0.10

        elif _contains_any(
            candidate_text,
            [
                "information technology equipment",
                "information technology",
            ],
        ):
            score += 0.05

    elif product_family == "router":

        if _contains_any(candidate_text, router_terms):
            score += 0.10

        elif _contains_any(
            candidate_text,
            [
                "network",
                "networking",
                "telecommunication",
                "information technology equipment",
            ],
        ):
            score += 0.04

    elif product_family == "switch":

        if _contains_any(candidate_text, switch_terms):
            score += 0.10

        elif _contains_any(
            candidate_text,
            [
                "network",
                "networking",
                "telecommunication",
            ],
        ):
            score += 0.04

    elif product_family == "server":

        if _contains_any(candidate_text, server_terms):
            score += 0.10

        elif _contains_any(
            candidate_text,
            computer_family_terms,
        ):
            score += 0.04

    elif product_family == "led_lamp":

        if _contains_any(candidate_text, led_lamp_terms):
            score += 0.10

    elif product_family == "battery":

        if _contains_any(candidate_text, battery_terms):
            score += 0.10

    elif product_family == "nuclear":

        if _contains_any(candidate_text, nuclear_terms):
            score += 0.12

    elif product_family == "power_supply":

        if _contains_any(candidate_text, power_supply_terms):
            score += 0.10

    elif product_family == "charger":

        if _contains_any(candidate_text, charger_terms):
            score += 0.10

    elif product_family == "adapter":

        if _contains_any(candidate_text, adapter_terms):
            score += 0.10

    # ------------------------------------------------------------------
    # SUPPORTING COMPONENT STANDARDS
    # ------------------------------------------------------------------

    component_terms = [
        "power supply",
        "power supplies",
        "dc power supply",
        "dc power supplies",
        "battery",
        "batteries",
        "secondary cell",
        "secondary cells",
        "secondary battery",
        "secondary batteries",
        "charger",
        "chargers",
        "adapter",
        "adapters",
    ]

    has_component_match = _contains_any(
        candidate_text,
        component_terms,
    )

    explicit_component_requirement = _contains_any(
        requirement_text,
        component_terms,
    )

    # Component standards are useful but must not outrank
    # product-level standards unless explicitly requested.
    if product_family in {
        "laptop",
        "desktop",
        "personal_computer",
        "monitor",
        "printer",
        "router",
        "switch",
        "server",
    }:

        if has_component_match and not explicit_component_requirement:
            score -= 0.04

    # Laptop power supply is still relevant as a secondary standard.
    if (
        product_family == "laptop"
        and _contains_any(candidate_text, power_supply_terms)
    ):
        score += 0.02

    # ------------------------------------------------------------------
    # SAFETY
    # ------------------------------------------------------------------

    if _contains_any(requirement_text, safety_terms):

        if _contains_any(
            candidate_text,
            [
                "safety",
                "electrical safety",
                "general requirements",
            ],
        ):
            score += 0.06

    # ------------------------------------------------------------------
    # INFORMATION TECHNOLOGY
    # ------------------------------------------------------------------

    if _contains_any(
        requirement_text,
        [
            "information technology equipment",
            "information technology",
            "it equipment",
        ],
    ):

        if _contains_any(
            candidate_text,
            [
                "information technology equipment",
                "information technology",
            ],
        ):
            score += 0.04

    # ------------------------------------------------------------------
    # NETWORKING
    # ------------------------------------------------------------------

    networking_terms = [
        "network",
        "networking",
        "router",
        "routers",
        "switch",
        "switches",
        "network equipment",
        "networking equipment",
        "telecommunication",
    ]

    if _contains_any(requirement_text, networking_terms):

        if _contains_any(candidate_text, networking_terms):
            score += 0.05

    # ------------------------------------------------------------------
    # ENERGY
    # ------------------------------------------------------------------

    if _contains_any(requirement_text, energy_terms):

        if _contains_any(candidate_text, energy_terms):
            score += 0.06

    # Even if energy was not explicitly requested, a standard
    # specifically covering desktop/notebook energy measurement
    # is relevant as a supporting standard for those products.
    if product_family in {"laptop", "desktop"}:

        if _contains_any(
            candidate_text,
            [
                "desktop and notebook computers",
                "measurement of energy consumption",
                "energy consumption",
            ],
        ):
            score += 0.05

    # ------------------------------------------------------------------
    # POWER REQUIREMENTS
    # ------------------------------------------------------------------

    if _contains_any(
        requirement_text,
        [
            "power supply",
            "power requirement",
            "power requirements",
        ],
    ):

        if _contains_any(
            candidate_text,
            power_supply_terms,
        ):
            score += 0.05

    # ------------------------------------------------------------------
    # EXPLICITLY UNRELATED COMPUTER DOMAINS
    # ------------------------------------------------------------------

    unrelated_domains = [
        (
            [
                "physical planning of computer complexes",
                "computer complexes",
                "computer complex",
            ],
            -0.18,
        ),
        (
            [
                "computer paper",
            ],
            -0.18,
        ),
        (
            [
                "fire resisting computer media",
                "computer media protection cabinets",
                "media protection cabinets",
            ],
            -0.16,
        ),
        (
            [
                "sound system",
                "sound system equipment",
                "audio equipment",
            ],
            -0.16,
        ),
        (
            [
                "computer graphics",
                "graphical kernel system",
                "image processing",
            ],
            -0.12,
        ),
    ]

    for mismatch_terms, penalty in unrelated_domains:

        if _contains_any(candidate_text, mismatch_terms):

            explicitly_requested = _contains_any(
                requirement_text,
                mismatch_terms,
            )

            if not explicitly_requested:
                score += penalty

    # ------------------------------------------------------------------
    # CROSS-DOMAIN PRODUCT MISMATCH
    # ------------------------------------------------------------------

    product_domain_groups = {
        "battery": battery_terms,
        "nuclear": nuclear_terms,
        "led_lamp": led_lamp_terms,
        "router": router_terms,
        "switch": switch_terms,
        "printer": printer_terms,
        "monitor": monitor_terms,
        "power_supply": power_supply_terms,
        "charger": charger_terms,
        "adapter": adapter_terms,
    }

    if product_family is not None:

        for family_name, family_terms in product_domain_groups.items():

            if family_name == product_family:
                continue

            if not _contains_any(
                candidate_text,
                family_terms,
            ):
                continue

            # Do not penalize a domain that the user explicitly requested.
            if _contains_any(
                requirement_text,
                family_terms,
            ):
                continue

            # Component standards are already handled above.
            if family_name in {
                "battery",
                "power_supply",
                "charger",
                "adapter",
            }:
                continue

            score -= 0.12
            break

    # ------------------------------------------------------------------
    # UNKNOWN METADATA MUST NOT CREATE POSITIVE SIGNAL
    # ------------------------------------------------------------------

    # No additional score is assigned for UNKNOWN scope/classification.
    # This is intentional.

    return max(
        -0.25,
        min(score, 0.20),
    )


def rank_candidates(
    candidates: list[dict],
    top_k: int = 10,
    normalized_requirements: dict[str, Any] | None = None,
) -> list[dict]:

    if top_k <= 0:
        raise ValueError(
            "top_k must be greater than 0."
        )

    ranked = []

    for candidate in candidates:

        semantic_score = float(
            candidate.get("score", 0.0)
        )

        compatibility_score = _candidate_compatibility(
            candidate,
            normalized_requirements,
        )

        final_score = (
            semantic_score
            + compatibility_score
        )

        enriched_candidate = dict(candidate)

        enriched_candidate["compatibility_score"] = round(
            compatibility_score,
            6,
        )

        enriched_candidate["final_score"] = round(
            final_score,
            6,
        )

        ranked.append(enriched_candidate)

    ranked.sort(
        key=lambda item: item["final_score"],
        reverse=True,
    )

    ranked = ranked[:top_k]

    for rank, candidate in enumerate(
        ranked,
        start=1,
    ):
        candidate["rank"] = rank

    return ranked