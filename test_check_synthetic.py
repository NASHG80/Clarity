import sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))
from database.check_demo_synthetic import check_synthetic_placement, DOCUMENTED_QUERIES

def make_doc(did, city, price, data_state, acc_items):
    return {
        "_id": did,
        "city": city,
        "price_inr_per_night": price,
        "data_state": data_state,
        "accessibility_items": acc_items
    }

def test_passing():
    # Setup test mock query
    DOCUMENTED_QUERIES["synth_1"] = {
        "city": "Goa",
        "budget_max": 3500,
        "accessibility_required": ["req_A"],
        "include_unverified": False
    }
    
    docs = [
        make_doc("synth_1", "Goa", 3000, "demo_synthetic", []),
        # Fails budget
        make_doc("real_1", "Goa", 4000, "reported", [{"label": "req_A", "data_state": "verified"}]),
        # Fails requirements (missing)
        make_doc("real_2", "Goa", 2000, "reported", []),
        # Fails requirements (not_verified)
        make_doc("real_3", "Goa", 2000, "reported", [{"label": "req_A", "data_state": "not_verified", "value": None}]),
        # Unrelated city
        make_doc("real_4", "Delhi", 2000, "reported", [{"label": "req_A", "data_state": "verified"}])
    ]
    
    res, viols = check_synthetic_placement(docs)
    assert len(viols) == 0, f"Expected 0 violations, got {len(viols)}"
    assert res[0]["is_justified"] == True
    assert res[0]["matches"] == 0

def test_failing_match():
    # Setup test mock query
    DOCUMENTED_QUERIES["synth_2"] = {
        "city": "Goa",
        "budget_max": 3500,
        "accessibility_required": ["req_A"],
        "include_unverified": False
    }
    
    docs = [
        make_doc("synth_2", "Goa", 3000, "demo_synthetic", []),
        # Passes everything!
        make_doc("real_1", "Goa", 3000, "reported", [{"label": "req_A", "data_state": "verified"}])
    ]
    
    res, viols = check_synthetic_placement(docs)
    assert len(viols) == 1, "Expected 1 violation for unjustified placement"
    assert res[0]["is_justified"] == False
    assert res[0]["matches"] == 1

def test_failing_undocumented():
    docs = [
        make_doc("synth_undocumented", "Goa", 3000, "demo_synthetic", [])
    ]
    res, viols = check_synthetic_placement(docs)
    assert len(viols) == 1
    assert "lacks a documented rehearsal query" in viols[0]

if __name__ == "__main__":
    test_passing()
    test_failing_match()
    test_failing_undocumented()
    print("All unit tests for check_demo_synthetic passed!")
