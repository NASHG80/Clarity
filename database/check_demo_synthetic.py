import argparse
import sys
from pathlib import Path
from typing import Dict, List, Any

sys.path.insert(0, str(Path.cwd()))
from database.seed import load_hotels_data

# The documented rehearsal query justifying the synthetic record.
DOCUMENTED_QUERIES = {
    "hotel_synthetic_001": {
        "city": "Goa",
        "budget_max": 3500,
        "accessibility_required": ["roll_in_shower", "step_free_entrance"],
        "include_unverified": False
    }
}

class Evaluation:
    def __init__(self, is_match: bool, reject_reasons: List[str]):
        self.is_match = is_match
        self.reject_reasons = reject_reasons

def evaluate_real_candidate(candidate: Dict[str, Any], query: Dict[str, Any]) -> Evaluation:
    reasons = []
    
    # Check city
    if candidate.get("city") != query["city"]:
        reasons.append(f"city: {candidate.get('city')} != {query['city']}")
        return Evaluation(False, reasons)
        
    # Check budget
    price = candidate.get("price_inr_per_night")
    if price is None or price >= query["budget_max"]:
        reasons.append(f"budget: {price} >= {query['budget_max']}")
        return Evaluation(False, reasons)
        
    # Check accessibility requirements
    acc_items = {item["label"]: item for item in candidate.get("accessibility_items", [])}
    for req in query["accessibility_required"]:
        item = acc_items.get(req)
        if not item:
            reasons.append(f"{req} missing from candidate")
            return Evaluation(False, reasons)
            
        state = item.get("data_state")
        if state == "demo_synthetic":
            # Real candidates shouldn't have demo items, but if they do, it's not valid real evidence
            reasons.append(f"{req} is demo_synthetic")
            return Evaluation(False, reasons)
            
        if state == "not_verified":
            if not query["include_unverified"]:
                reasons.append(f"{req} is not_verified (include_unverified=False)")
                return Evaluation(False, reasons)
            # If include_unverified is true, we might allow it (though not the case for our demo)
            
        elif state not in ["verified", "reported", "community_confirmed"]:
            reasons.append(f"{req} has invalid state {state}")
            return Evaluation(False, reasons)
            
    return Evaluation(True, [])

def check_synthetic_placement(docs: List[Dict[str, Any]]) -> tuple:
    violations = []
    synthetic_records = []
    real_records = []
    
    for doc in docs:
        if doc.get("data_state") == "demo_synthetic":
            synthetic_records.append(doc)
        else:
            real_records.append(doc)
            
    results = []
    
    for synth in synthetic_records:
        sid = synth["_id"]
        if sid not in DOCUMENTED_QUERIES:
            violations.append(f"Synthetic record {sid} lacks a documented rehearsal query.")
            continue
            
        query = DOCUMENTED_QUERIES[sid]
        
        matches = 0
        rejections = {}
        for real in real_records:
            eval_res = evaluate_real_candidate(real, query)
            if eval_res.is_match:
                matches += 1
            else:
                if real.get("city") == query["city"]:
                    rejections[real["_id"]] = eval_res.reject_reasons
                    
        is_justified = (matches == 0)
        if not is_justified:
            violations.append(f"Synthetic record {sid} is UNJUSTIFIED. Found {matches} real matches.")
            
        results.append({
            "synthetic_id": sid,
            "query": query,
            "real_considered": len(real_records),
            "matches": matches,
            "is_justified": is_justified,
            "rejections": rejections
        })
        
    return results, violations

def run_mongo_check():
    try:
        from backend.app.db.mongo import get_db, COLLECTION_HOTELS
        db = get_db()
        db.command("ping")
    except Exception as e:
        print(f"Error: MongoDB unavailable: {e}", file=sys.stderr)
        sys.exit(2)
        
    docs = list(db[COLLECTION_HOTELS].find({}))
    return check_synthetic_placement(docs)

def run_seed_check():
    docs = load_hotels_data()
    return check_synthetic_placement(docs)

def print_report(results, violations, source):
    print("DEMO-SYNTHETIC PLACEMENT CHECK")
    print(f"Source: {source}")
    print(f"Synthetic records discovered: {len(results)}\n")
    
    for res in results:
        print(f"Synthetic: {res['synthetic_id']}")
        print("Query:")
        for k, v in res["query"].items():
            print(f"  {k} = {v}")
        print(f"\nReal records considered: {res['real_considered']}")
        print(f"Real matching records: {res['matches']}")
        
        if res['matches'] == 0:
            print("Synthetic placement: JUSTIFIED")
        else:
            print("Synthetic placement: UNJUSTIFIED")
            
        print("\nRejection reasons for nearby candidates:")
        for rid, reasons in res["rejections"].items():
            print(f"  Real candidate: {rid}")
            for r in reasons:
                print(f"    - {r}")
        print("-" * 40)
        
    if violations:
        print("STATUS: FAIL\n")
        for v in violations:
            print(f"[Violation] {v}")
        sys.exit(1)
    else:
        print("Status: PASS")
        sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["seed", "mongo"], required=True)
    args = parser.parse_args()
    
    if args.source == "seed":
        results, violations = run_seed_check()
    else:
        results, violations = run_mongo_check()
        
    print_report(results, violations, args.source)
