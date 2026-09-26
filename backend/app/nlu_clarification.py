"""C10 — Rule-based clarification question filtering.

This module is a deterministic post-processing layer that runs after C9
extraction. It takes the extracted fields and the list of missing/ambiguous
items produced by C9 and returns only the items that actually require a
clarification question before the full Requirement Form opens.

Rules implemented (all canonical, from AGENTS.md / IMPLEMENTATION_PLAN.md):

  Rule 1 — Adult count
    If children_count OR senior_count is explicitly present, AND adult_count
    is missing, retain/generate the adult-count clarification question.
    Canonical wording: "How many adults are traveling?"

  Rule 2 — Weight preferences
    Weight preference fields (environmental, accessibility, affordability,
    convenience) are NEVER mandatory clarification items. They have sane
    form defaults and belong to the editable Requirement Form, not
    pre-form clarification.

No LLM is used here. No inference is performed here. No field values are
invented or defaulted by this module.
"""

from typing import List, Optional

from app.models.schemas import NLUExtracted, NLUAmbiguousField

# ---------------------------------------------------------------------------
# Canonical constants
# ---------------------------------------------------------------------------

ADULT_COUNT_FIELD = "adult_count"
ADULT_COUNT_PROMPT = "How many adults are traveling?"

# Fields that are never blocking clarification items — they have form defaults.
_WEIGHT_FIELDS = frozenset({
    "environmental_weight",
    "accessibility_weight",
    "affordability_weight",
    "convenience_weight",
    # Also match any variant C9 might emit (sustainability, etc.)
    "weight_environmental",
    "weight_accessibility",
    "weight_affordability",
    "weight_convenience",
    "sustainability_preference",  # preference, not a count — has defaults
})


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def filter_clarification_items(
    extracted: NLUExtracted,
    missing_or_ambiguous: List[NLUAmbiguousField],
) -> List[NLUAmbiguousField]:
    """Return the filtered list of clarification items that require a question.

    Pure function — does not mutate arguments, does not call any LLM,
    does not infer or invent traveler data.

    Args:
        extracted: The C9 structured extraction result.
        missing_or_ambiguous: The C9-produced list of missing/ambiguous items.

    Returns:
        A new list containing only the clarification items that must be
        answered before opening the full Requirement Form, in deterministic
        order.
    """
    # Work on a copy so we never mutate the caller's list.
    result: List[NLUAmbiguousField] = []
    seen_fields = set()

    # -----------------------------------------------------------------------
    # Pass 1 — carry forward items from C9, applying filter rules.
    # -----------------------------------------------------------------------
    for item in missing_or_ambiguous:
        field = item.field

        # Rule 2: drop weight-preference items — they have form defaults.
        if field in _WEIGHT_FIELDS:
            continue

        # Rule 1 (dedup guard): if C9 already produced an adult_count item,
        # we keep it only when the rule condition is satisfied. We re-check
        # below to avoid duplicates.
        if field == ADULT_COUNT_FIELD:
            if _adult_clarification_needed(extracted):
                if ADULT_COUNT_FIELD not in seen_fields:
                    result.append(NLUAmbiguousField(field=field, prompt=item.prompt))
                    seen_fields.add(ADULT_COUNT_FIELD)
            continue

        # All other fields: carry forward as-is (canonical rules do not
        # suppress them).
        result.append(item)
        seen_fields.add(field)

    # -----------------------------------------------------------------------
    # Pass 2 — Rule 1 injection: if C9 did NOT mention adult_count at all,
    # but the rule condition is met, generate the canonical question.
    # -----------------------------------------------------------------------
    if ADULT_COUNT_FIELD not in seen_fields and _adult_clarification_needed(extracted):
        result.append(
            NLUAmbiguousField(field=ADULT_COUNT_FIELD, prompt=ADULT_COUNT_PROMPT)
        )

    return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _adult_clarification_needed(extracted: NLUExtracted) -> bool:
    """Return True iff Rule 1 requires an adult-count clarification question.

    Condition: adult_count is missing (None) AND at least one of
    children_count or senior_count is explicitly present (not None).

    This deliberately does NOT fire when only adult_count is missing but
    no other traveler count is mentioned — the form handles that silently.
    """
    if extracted.adult_count is not None:
        # Adult count was explicitly stated — no question needed.
        return False

    has_children = extracted.children_count is not None
    has_seniors = extracted.senior_count is not None
    return has_children or has_seniors
