import sys
import os
import pytest
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.db.mongo import get_db
from database.reset_demo_data import get_cleanup_queries, COLLECTION_INSPECTIONS
from database.generate_demo_analytics import COLLECTION_ANALYTICS
import subprocess

@pytest.fixture(scope="module")
def test_db():
    # Use an isolated test database
    os.environ["MONGO_DB_NAME"] = "test_clarity_reset"
    db = get_db()
    
    # Clean up before
    db.client.drop_database("test_clarity_reset")
    
    yield db
    
    # Clean up after
    db.client.drop_database("test_clarity_reset")

def test_dry_run_safety(test_db):
    # Insert a dummy record
    test_db[COLLECTION_ANALYTICS].insert_one({"_id": "demo_evt_123", "business_id": "biz_001"})
    
    result = subprocess.run(
        ["python", "database/reset_demo_data.py", "--dry-run"],
        capture_output=True, text=True, env=os.environ
    )
    assert result.returncode == 0
    assert "[DRY RUN]" in result.stdout
    
    # Record must still exist
    assert test_db[COLLECTION_ANALYTICS].count_documents({}) == 1

def test_demo_cleanup(test_db):
    # Clear any previous test state
    test_db[COLLECTION_ANALYTICS].delete_many({})
    test_db[COLLECTION_INSPECTIONS].delete_many({})
    
    # Insert mixed records
    test_db[COLLECTION_ANALYTICS].insert_many([
        {"_id": "demo_evt_001", "business_id": "biz_001"},  # Should be deleted
        {"_id": "real_evt_001", "business_id": "biz_999"}   # Should be preserved
    ])
    
    test_db[COLLECTION_INSPECTIONS].insert_many([
        {"_id": "insp_001", "business_id": "biz_001"},      # Should be deleted
        {"_id": "insp_002", "business_id": "biz_999"}       # Should be preserved
    ])
    
    # Run reset (skip reseeding for speed here, just test cleanup)
    result = subprocess.run(
        ["python", "database/reset_demo_data.py", "--skip-seed", "--skip-analytics"],
        capture_output=True, text=True, env=os.environ
    )
    assert result.returncode == 0
    
    # Verify cleanup
    assert test_db[COLLECTION_ANALYTICS].count_documents({}) == 1
    assert test_db[COLLECTION_ANALYTICS].find_one()["_id"] == "real_evt_001"
    
    assert test_db[COLLECTION_INSPECTIONS].count_documents({}) == 1
    assert test_db[COLLECTION_INSPECTIONS].find_one()["_id"] == "insp_002"

def test_idempotency_and_reset(test_db):
    # Full reset run 1
    result1 = subprocess.run(
        ["python", "database/reset_demo_data.py"],
        capture_output=True, text=True, env=os.environ
    )
    assert result1.returncode == 0
    
    hotels_count_1 = test_db["hotels"].count_documents({})
    analytics_count_1 = test_db[COLLECTION_ANALYTICS].count_documents({})
    
    assert hotels_count_1 > 0
    assert analytics_count_1 > 0
    
    # Simulate someone messing with data
    test_db["hotels"].update_one({}, {"$set": {"data_state": "corrupted"}})
    test_db[COLLECTION_ANALYTICS].insert_one({"_id": "demo_evt_fake", "business_id": "biz_001"})
    
    # Full reset run 2
    result2 = subprocess.run(
        ["python", "database/reset_demo_data.py"],
        capture_output=True, text=True, env=os.environ
    )
    assert result2.returncode == 0
    
    hotels_count_2 = test_db["hotels"].count_documents({})
    analytics_count_2 = test_db[COLLECTION_ANALYTICS].count_documents({})
    
    assert hotels_count_1 == hotels_count_2
    assert analytics_count_1 == analytics_count_2
    
    # Verify state was restored
    assert test_db["hotels"].count_documents({"data_state": "corrupted"}) == 0
