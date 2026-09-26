import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path.cwd()))
from database.seed import load_hotels_data, load_businesses_data, seed_businesses

hotels = load_hotels_data()
valid_hotel_ids = {h["_id"] for h in hotels}

businesses = load_businesses_data(valid_hotel_ids)
print(f"Total businesses loaded: {len(businesses)}")
assert 2 <= len(businesses) <= 3, f"Expected 2-3 businesses, got {len(businesses)}"

for biz in businesses:
    doc_id = biz['_id']
    assert biz['hotel_id'] in valid_hotel_ids
    assert isinstance(biz.get('onboarding_complete', False), bool)
    
    for opp in biz.get('opportunities', []):
        assert opp['severity'] in ('red', 'yellow', 'green')
        assert opp.get('is_demo_data') is True

print("All integrity criteria passed successfully!")

class MockCollection:
    def __init__(self):
        self.docs = {}
    def replace_one(self, query, doc, upsert=False):
        doc_id = query.get("_id")
        self.docs[doc_id] = doc
    def count_documents(self, query):
        return len(self.docs)
    def create_index(self, *args, **kwargs):
        pass
    def create_indexes(self, *args, **kwargs):
        pass
    def find(self, query, projection):
        # mock for valid_hotel_ids extraction
        # Since we use fallback to file if empty, returning empty list is fine for testing fallback.
        return []

class MockDatabase:
    def __init__(self):
        self.businesses = MockCollection()
        self.hotels = MockCollection()
    def __getitem__(self, name):
        if name == "businesses":
            return self.businesses
        if name == "hotels":
            return self.hotels
        return MockCollection()

db = MockDatabase()

# First seed
count = seed_businesses(db=db)
coll = db.businesses
assert coll.count_documents({}) == 3, "Should have inserted 3 docs"

# Second seed (idempotency check)
count = seed_businesses(db=db)
assert coll.count_documents({}) == 3, "Should still have 3 docs after second seed (idempotent upsert)"

print("Idempotency verification passed successfully!")
