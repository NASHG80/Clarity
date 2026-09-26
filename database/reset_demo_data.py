"""
Idempotent Demo Reset Script (Task D18)

Scope:
- Targets explicitly marked demo data generated during hackathon rehearsals.
- Identifies rehearsal analytics via business IDs (`biz_001`, `biz_002`, `biz_003`) or `demo_evt_` prefix.
- Identifies demo `ai_inspections` (if any) via the same demo business IDs.
- Preserves all real canonical researched seed data.
- Does NOT blindly drop the database.
- Restores canonical MongoDB state using existing `seed.py` and `generate_demo_analytics.py`.
"""

import argparse
import sys
import os
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.db.mongo import get_db, COLLECTION_BUSINESSES
from database.seed import (
    seed_hotels,
    seed_transport_routes,
    seed_experiences,
    seed_businesses,
    seed_confirmations
)
from database.generate_demo_analytics import generate_and_seed, COLLECTION_ANALYTICS

DEMO_BIZ_IDS = ["biz_001", "biz_002", "biz_003"]
COLLECTION_INSPECTIONS = "ai_inspections"

def get_cleanup_queries():
    return {
        COLLECTION_ANALYTICS: {
            "$or": [
                {"_id": {"$regex": "^demo_evt_"}},
                {"business_id": {"$in": DEMO_BIZ_IDS}}
            ]
        },
        COLLECTION_INSPECTIONS: {
            "business_id": {"$in": DEMO_BIZ_IDS}
        }
    }

def main():
    parser = argparse.ArgumentParser(description="Deterministic Demo Rehearsal Reset")
    parser.add_argument("--source", choices=["mongo"], default="mongo", help="Target source (only mongo supported)")
    parser.add_argument("--dry-run", action="store_true", help="Report intentions without mutating data")
    parser.add_argument("--skip-seed", action="store_true", help="Skip canonical reseeding")
    parser.add_argument("--skip-analytics", action="store_true", help="Skip demo analytics regeneration")
    args = parser.parse_args()

    db = get_db()
    
    # Safety Check: Warn if the DB name doesn't sound like a test or demo DB,
    # though we proceed if the user is sure. For prototype, we just warn.
    db_name = db.name
    if "prod" in db_name.lower():
        print(f"ERROR: Database name '{db_name}' appears to be production. Aborting demo reset.")
        sys.exit(1)

    print(f"=== Demo Rehearsal Reset (Database: {db_name}) ===")
    
    queries = get_cleanup_queries()
    
    if args.dry_run:
        print("\n[DRY RUN] Would execute the following removals:")
        for coll_name, query in queries.items():
            if coll_name in db.list_collection_names():
                count = db[coll_name].count_documents(query)
                print(f"  - {coll_name}: {count} demo records matching {query}")
            else:
                print(f"  - {coll_name}: collection does not exist.")
        print("\n[DRY RUN] Would then run `seed.py` and `generate_demo_analytics.py`.")
        print("[DRY RUN] Complete. No data mutated.")
        sys.exit(0)

    # 1. Cleanup Demo-Owned State
    print("\n1. Cleaning up rehearsal state...")
    for coll_name, query in queries.items():
        if coll_name in db.list_collection_names():
            result = db[coll_name].delete_many(query)
            print(f"  - {coll_name}: Removed {result.deleted_count} demo-owned records.")
        else:
            print(f"  - {coll_name}: Collection does not exist, skipping.")

    # 2. Reseed Canonical Data
    if not args.skip_seed:
        print("\n2. Reseeding canonical static data...")
        total_h, _, _, _ = seed_hotels(db)
        print(f"  - {total_h} hotels upserted")
        total_r, _, _, _ = seed_transport_routes(db)
        print(f"  - {total_r} routes upserted")
        total_e = seed_experiences(db)
        print(f"  - {total_e} experiences upserted")
        total_b = seed_businesses(db)
        print(f"  - {total_b} businesses upserted")
        total_c = seed_confirmations(db)
        print(f"  - {total_c} confirmations upserted")
    else:
        print("\n2. Skipping canonical seed.")

    # 3. Regenerate Analytics
    if not args.skip_analytics:
        print("\n3. Regenerating demo analytics...")
        events = generate_and_seed(db)
        print(f"  - {len(events)} demo analytics events generated.")
    else:
        print("\n3. Skipping demo analytics regeneration.")

    print("\n=== Reset Complete ===")
    print("Run `python database/audit_data_state.py --source mongo` to verify integrity.")

if __name__ == "__main__":
    main()
