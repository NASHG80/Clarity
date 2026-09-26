import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path.cwd()))
from database.seed import load_hotels_data, load_confirmations_data, seed_confirmations
from backend.recommendation_engine.config import CONFIRMATION_THRESHOLD

print(f"CONFIRMATION_THRESHOLD: {CONFIRMATION_THRESHOLD}")

hotels = load_hotels_data()
valid_hotel_item_map = {}
for h in hotels:
    items = set()
    for acc in h.get("accessibility_items", []):
        items.add(acc["label"])
    for sus in h.get("sustainability_items", []):
        items.add(sus["label"])
    valid_hotel_item_map[h["_id"]] = items

confirmations = load_confirmations_data(valid_hotel_item_map)
print(f"Total confirmations loaded: {len(confirmations)}")

below_t = 0
above_t = 0
for conf in confirmations:
    count = conf.get("confirmed_by_count", 0)
    if count >= CONFIRMATION_THRESHOLD:
        above_t += 1
    else:
        below_t += 1

print(f"Below threshold: {below_t}")
print(f"At/above threshold: {above_t}")
assert below_t > 0, "No records below threshold"
assert above_t > 0, "No records at/above threshold"
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

class MockDatabase:
    def __init__(self):
        self.confirmations = MockCollection()
    def __getitem__(self, name):
        if name == "confirmations":
            return self.confirmations
        return MockCollection()

db = MockDatabase()

# First seed
count = seed_confirmations(db=db)
coll = db.confirmations
assert coll.count_documents({}) == 3, "Should have inserted 3 docs"

# Second seed (idempotency check)
count = seed_confirmations(db=db)
assert coll.count_documents({}) == 3, "Should still have 3 docs after second seed (idempotent upsert)"

print("Idempotency verification passed successfully!")
