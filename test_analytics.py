import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path.cwd()))
from database.generate_demo_analytics import generate_and_seed, FUNNEL_STAGES

class MockBulkResult:
    def __init__(self, upserted_count, modified_count):
        self.upserted_count = upserted_count
        self.modified_count = modified_count

class MockCollection:
    def __init__(self):
        self.docs = {}
    def bulk_write(self, requests):
        upserted = 0
        modified = 0
        for req in requests:
            doc = req._doc
            doc_id = doc["_id"]
            if doc_id not in self.docs:
                upserted += 1
            else:
                modified += 1
            self.docs[doc_id] = doc
        return MockBulkResult(upserted, modified)
        
    def count_documents(self, query):
        return len(self.docs)
        
    def create_index(self, *args, **kwargs):
        pass
        
    def create_indexes(self, *args, **kwargs):
        pass

class MockDatabase:
    def __init__(self):
        self.analytics_events = MockCollection()
    def __getitem__(self, name):
        if name == "analytics_events":
            return self.analytics_events
        return MockCollection()

db = MockDatabase()

print("--- FIRST RUN ---")
events1 = generate_and_seed(db)
count1 = db.analytics_events.count_documents({})
print(f"Total inserted: {count1}")

print("\n--- SECOND RUN (Idempotency) ---")
events2 = generate_and_seed(db)
count2 = db.analytics_events.count_documents({})
print(f"Total after second run: {count2}")
assert count1 == count2, "Count changed on second run!"

# Database inspection (recompute from mock db)
print("\n--- DB Inspection ---")
db_funnel = {}
for doc in db.analytics_events.docs.values():
    biz_id = doc["business_id"]
    evt = doc["event_type"]
    if evt in FUNNEL_STAGES:
        if biz_id not in db_funnel:
            db_funnel[biz_id] = {s: 0 for s in FUNNEL_STAGES}
        db_funnel[biz_id][evt] += 1

for biz_id, counts in db_funnel.items():
    print(f"DB Funnel {biz_id}: {counts}")
