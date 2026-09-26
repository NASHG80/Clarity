"""Tests for C10 rule-based clarification filtering."""

import pytest
from app.models.schemas import NLUExtracted, NLUAmbiguousField
from app.nlu_clarification import (
    filter_clarification_items,
    ADULT_COUNT_FIELD,
    ADULT_COUNT_PROMPT,
    _adult_clarification_needed,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ambig(*fields_and_prompts) -> list:
    """Build a list of NLUAmbiguousField quickly."""
    return [NLUAmbiguousField(field=f, prompt=p) for f, p in fields_and_prompts]


def _extracted(**kwargs) -> NLUExtracted:
    return NLUExtracted(**kwargs)


# ---------------------------------------------------------------------------
# Rule 1 — adult count clarification
# ---------------------------------------------------------------------------

def test_1_children_missing_adult_triggers_clarification():
    ext = _extracted(children_count=2, senior_count=None, adult_count=None)
    result = filter_clarification_items(ext, [])
    assert any(item.field == ADULT_COUNT_FIELD for item in result)


def test_2_senior_missing_adult_triggers_clarification():
    ext = _extracted(children_count=None, senior_count=1, adult_count=None)
    result = filter_clarification_items(ext, [])
    assert any(item.field == ADULT_COUNT_FIELD for item in result)


def test_3_children_and_senior_missing_adult_triggers_clarification():
    ext = _extracted(children_count=2, senior_count=1, adult_count=None)
    result = filter_clarification_items(ext, [])
    assert any(item.field == ADULT_COUNT_FIELD for item in result)


def test_4_explicit_adult_count_no_clarification():
    ext = _extracted(children_count=2, senior_count=1, adult_count=1)
    result = filter_clarification_items(ext, [])
    assert not any(item.field == ADULT_COUNT_FIELD for item in result)


def test_5_only_adult_no_clarification():
    ext = _extracted(children_count=None, senior_count=None, adult_count=2)
    result = filter_clarification_items(ext, [])
    assert not any(item.field == ADULT_COUNT_FIELD for item in result)


def test_6_no_traveler_counts_no_adult_clarification():
    # Rule 1 only fires when children OR senior is mentioned.
    # If nothing is mentioned, no adult clarification is injected.
    ext = _extracted(origin="Mumbai", destination="Goa")
    result = filter_clarification_items(ext, [])
    assert not any(item.field == ADULT_COUNT_FIELD for item in result)


def test_7_c9_adult_item_preserved_when_rule_fires():
    ext = _extracted(children_count=2, adult_count=None)
    items = _ambig(("adult_count", "How many adults?"))
    result = filter_clarification_items(ext, items)
    adult_items = [i for i in result if i.field == ADULT_COUNT_FIELD]
    assert len(adult_items) == 1
    assert adult_items[0].prompt == "How many adults?"


def test_8_c9_adult_item_dropped_when_rule_does_not_fire():
    # adult_count is in missing list, but since children/senior not present,
    # rule 1 doesn't apply → item dropped.
    ext = _extracted(adult_count=None, children_count=None, senior_count=None)
    items = _ambig(("adult_count", "How many adults?"))
    result = filter_clarification_items(ext, items)
    assert not any(i.field == ADULT_COUNT_FIELD for i in result)


# ---------------------------------------------------------------------------
# Rule 2 — weight preferences never trigger clarification
# ---------------------------------------------------------------------------

def test_9_weight_fields_not_in_result():
    ext = _extracted()
    items = _ambig(
        ("environmental_weight", "How important is sustainability?"),
        ("affordability_weight", "How important is affordability?"),
        ("convenience_weight", "How important is convenience?"),
        ("accessibility_weight", "How important is accessibility?"),
    )
    result = filter_clarification_items(ext, items)
    weight_items = [i for i in result if "weight" in i.field]
    assert weight_items == []


def test_10_sustainability_preference_not_in_result():
    ext = _extracted()
    items = _ambig(("sustainability_preference", "Do you prefer eco options?"))
    result = filter_clarification_items(ext, items)
    assert not any(i.field == "sustainability_preference" for i in result)


def test_11_weight_present_no_clarification_generated():
    # Even if C9 doesn't mention weight at all, C10 must not invent one.
    ext = _extracted(origin="Mumbai")
    result = filter_clarification_items(ext, [])
    assert not any("weight" in i.field for i in result)


# ---------------------------------------------------------------------------
# Multiple fields — ordering and filtering together
# ---------------------------------------------------------------------------

def test_12_multiple_missing_fields_only_documented_survive():
    ext = _extracted(children_count=2, adult_count=None)
    items = _ambig(
        ("adult_count", "How many adults?"),
        ("environmental_weight", "Eco preference?"),
        ("travel_date", "When are you traveling?"),
    )
    result = filter_clarification_items(ext, items)
    fields = [i.field for i in result]
    assert ADULT_COUNT_FIELD in fields
    assert "travel_date" in fields
    assert "environmental_weight" not in fields


def test_13_original_field_prompt_shape_preserved():
    ext = _extracted(senior_count=1, adult_count=None)
    items = _ambig(("adult_count", "Custom prompt from C9"))
    result = filter_clarification_items(ext, items)
    adult_item = next(i for i in result if i.field == ADULT_COUNT_FIELD)
    assert adult_item.prompt == "Custom prompt from C9"
    assert hasattr(adult_item, "field")
    assert hasattr(adult_item, "prompt")


def test_14_ordering_preserved():
    ext = _extracted(children_count=1, adult_count=None)
    items = _ambig(
        ("adult_count", "Adults?"),
        ("travel_date", "When?"),
    )
    result = filter_clarification_items(ext, items)
    assert result[0].field == ADULT_COUNT_FIELD
    assert result[1].field == "travel_date"


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

def test_15_empty_missing_list_returns_empty_or_injected_only():
    ext = _extracted()  # No counts at all
    result = filter_clarification_items(ext, [])
    assert result == []


def test_16_no_input_mutation():
    ext = _extracted(children_count=2, adult_count=None)
    original_items = _ambig(("travel_date", "When?"))
    original_copy = list(original_items)
    filter_clarification_items(ext, original_items)
    assert len(original_items) == len(original_copy)
    assert original_items[0].field == original_copy[0].field


def test_17_no_llm_call_is_deterministic():
    """Repeated identical input → identical output (proves no LLM call)."""
    ext = _extracted(children_count=2, senior_count=1, adult_count=None)
    items = _ambig(("adult_count", "Adults?"))
    r1 = filter_clarification_items(ext, list(items))
    r2 = filter_clarification_items(ext, list(items))
    assert [i.field for i in r1] == [i.field for i in r2]
    assert [i.prompt for i in r1] == [i.prompt for i in r2]


def test_18_no_invented_values():
    """C10 must not set extracted field values."""
    ext = _extracted(children_count=2, adult_count=None)
    filter_clarification_items(ext, [])
    # adult_count must still be None after C10 runs
    assert ext.adult_count is None


def test_19_adult_count_not_duplicated():
    """If C9 supplies adult_count and rule fires, result has exactly one item."""
    ext = _extracted(children_count=2, adult_count=None)
    items = _ambig(("adult_count", "Adults?"))
    result = filter_clarification_items(ext, items)
    adult_items = [i for i in result if i.field == ADULT_COUNT_FIELD]
    assert len(adult_items) == 1


def test_20_canonical_prompt_used_when_c9_omits_adult_item():
    """When C9 omits adult_count from missing list but rule fires, use canonical wording."""
    ext = _extracted(children_count=1, adult_count=None)
    result = filter_clarification_items(ext, [])
    adult_items = [i for i in result if i.field == ADULT_COUNT_FIELD]
    assert len(adult_items) == 1
    assert adult_items[0].prompt == ADULT_COUNT_PROMPT


# ---------------------------------------------------------------------------
# Internal helper tests
# ---------------------------------------------------------------------------

def test_21_adult_clarification_needed_helper_cases():
    assert _adult_clarification_needed(_extracted(children_count=1, adult_count=None))
    assert _adult_clarification_needed(_extracted(senior_count=1, adult_count=None))
    assert not _adult_clarification_needed(_extracted(children_count=1, adult_count=2))
    assert not _adult_clarification_needed(_extracted(adult_count=None))  # no counts
