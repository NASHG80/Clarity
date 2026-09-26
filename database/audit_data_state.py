import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Add project root to sys.path
sys.path.insert(0, str(Path.cwd()))

VALID_DATA_STATES = {
    "verified",
    "reported",
    "community_confirmed",
    "not_verified",
    "demo_synthetic"
}

COLLECTIONS = [
    "hotels",
    "transport_routes",
    "experiences",
    "businesses",
    "confirmations",
    "ai_inspections",
    "analytics_events"
]

class Violation:
    def __init__(self, collection: str, document: str, path: str, error_type: str, value: Any = None):
        self.collection = collection
        self.document = document
        self.path = path
        self.error_type = error_type
        self.value = value

    def __str__(self):
        return (f"[{self.error_type}]\n"
                f"collection={self.collection}\n"
                f"document={self.document}\n"
                f"path={self.path}\n"
                f"value={self.value}\n")

def audit_object(obj: Any, current_path: str, collection: str, doc_id: str, violations: List[Violation]) -> int:
    """
    Recursively scans obj for data_state fields.
    Returns the number of data_state fields inspected.
    Appends to violations list.
    """
    data_state_count = 0
    if isinstance(obj, dict):
        if "data_state" in obj:
            data_state_count += 1
            state = obj["data_state"]
            
            if state not in VALID_DATA_STATES:
                violations.append(Violation(collection, doc_id, f"{current_path}.data_state" if current_path else "data_state", "invalid_data_state", state))
            
            if state == "not_verified":
                if "value" in obj and obj["value"] is not None:
                    # Explicitly flag non-null values
                    violations.append(Violation(collection, doc_id, f"{current_path}.value" if current_path else "value", "not_verified_non_null", obj["value"]))
        
        for k, v in obj.items():
            path_ext = f"{current_path}.{k}" if current_path else k
            data_state_count += audit_object(v, path_ext, collection, doc_id, violations)
            
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            path_ext = f"{current_path}[{i}]" if current_path else f"[{i}]"
            data_state_count += audit_object(v, path_ext, collection, doc_id, violations)
            
    return data_state_count

def audit_documents(collection_name: str, docs: List[Dict[str, Any]]) -> Tuple[int, int, List[Violation]]:
    """Audits a list of documents. Returns (docs_scanned, states_scanned, violations)."""
    docs_scanned = 0
    states_scanned = 0
    violations = []
    
    for doc in docs:
        docs_scanned += 1
        doc_id = str(doc.get("_id", "UNKNOWN_ID"))
        states_scanned += audit_object(doc, "", collection_name, doc_id, violations)
        
    return docs_scanned, states_scanned, violations

def get_seed_files(data_dir: Path) -> Dict[str, Path]:
    """Map collection names to actual seed file paths."""
    mapping = {}
    for coll in COLLECTIONS:
        path = data_dir / f"{coll}.json"
        if path.exists():
            mapping[coll] = path
    return mapping

def audit_seed() -> Tuple[int, int, int, List[Violation]]:
    """Audits seed JSON files. Returns (collections_scanned, docs_scanned, states_scanned, violations)."""
    data_dir = Path("database/seed_data")
    seed_files = get_seed_files(data_dir)
    
    collections_scanned = 0
    total_docs = 0
    total_states = 0
    all_violations = []
    
    for coll_name, path in seed_files.items():
        try:
            with open(path, "r", encoding="utf-8") as f:
                docs = json.load(f)
            
            if not isinstance(docs, list):
                docs = [docs]
                
            collections_scanned += 1
            d_count, s_count, viols = audit_documents(coll_name, docs)
            total_docs += d_count
            total_states += s_count
            all_violations.extend(viols)
        except Exception as e:
            print(f"Error reading seed file {path}: {e}", file=sys.stderr)
            
    return collections_scanned, total_docs, total_states, all_violations

def audit_mongo() -> Tuple[int, int, int, List[Violation]]:
    """Audits MongoDB collections. Returns (collections_scanned, docs_scanned, states_scanned, violations)."""
    try:
        from backend.app.db.mongo import get_db
    except ImportError:
        print("Error: Could not import get_db from backend.app.db.mongo. Cannot audit MongoDB.", file=sys.stderr)
        sys.exit(2)
        
    try:
        db = get_db()
        # Verify connection
        db.command("ping")
    except Exception as e:
        print(f"Error: MongoDB unavailable: {e}", file=sys.stderr)
        sys.exit(2)
        
    collections_scanned = 0
    total_docs = 0
    total_states = 0
    all_violations = []
    
    for coll_name in COLLECTIONS:
        coll = db[coll_name]
        try:
            docs = list(coll.find({}))
            if docs:
                collections_scanned += 1
                d_count, s_count, viols = audit_documents(coll_name, docs)
                total_docs += d_count
                total_states += s_count
                all_violations.extend(viols)
        except Exception as e:
            print(f"Error querying MongoDB collection '{coll_name}': {e}", file=sys.stderr)
            
    return collections_scanned, total_docs, total_states, all_violations

def main():
    parser = argparse.ArgumentParser(description="Static audit tool for the canonical five-state data model.")
    parser.add_argument("--source", choices=["seed", "mongo"], required=True, help="Source to audit (seed files or MongoDB)")
    args = parser.parse_args()
    
    print("DATA-STATE AUDIT")
    print(f"Source: {args.source}")
    
    if args.source == "seed":
        collections_scanned, docs_scanned, states_scanned, violations = audit_seed()
    elif args.source == "mongo":
        collections_scanned, docs_scanned, states_scanned, violations = audit_mongo()
        
    print(f"Collections scanned: {collections_scanned}")
    print(f"Documents scanned: {docs_scanned}")
    print(f"data_state fields scanned: {states_scanned}")
    print(f"Violations: {len(violations)}")
    
    if violations:
        print("Status: FAIL\n")
        for v in violations:
            print(v)
        sys.exit(1)
    else:
        print("Status: PASS")
        sys.exit(0)

if __name__ == "__main__":
    main()
