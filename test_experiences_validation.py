import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path.cwd()))
from database.seed import load_experiences_data, seed_experiences

experiences = load_experiences_data()
print(f"Total experiences loaded: {len(experiences)}")
assert len(experiences) >= 8 and len(experiences) <= 12, f"Expected 8-12 experiences, got {len(experiences)}"

for exp in experiences:
    doc_id = exp['_id']
    # Check translations
    for lang in ('en', 'hi', 'mr'):
        assert lang in exp['translations'], f"Missing {lang} in {doc_id}"
        assert len(exp['translations'][lang]['name']) > 0, f"Empty {lang} name in {doc_id}"
        assert len(exp['translations'][lang]['description']) > 0, f"Empty {lang} desc in {doc_id}"
    
    # Check accessibility
    acc = exp.get('accessibility')
    if acc:
        state = acc['data_state']
        assert state in ('verified', 'reported', 'community_confirmed', 'not_verified', 'demo_synthetic'), f"Bad state {state} in {doc_id}"
        if state == 'not_verified':
            assert acc.get('value') is None, f"Non-null value for not_verified acc in {doc_id}"
            
    # Check environmental_impact
    env = exp.get('environmental_impact')
    if env:
        state = env['data_state']
        assert state in ('verified', 'reported', 'community_confirmed', 'not_verified', 'demo_synthetic'), f"Bad state {state} in {doc_id}"
        if state == 'not_verified':
            assert env.get('value') is None, f"Non-null value for not_verified env in {doc_id}"

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
        self.experiences = MockCollection()
    def __getitem__(self, name):
        if name == "experiences":
            return self.experiences
        return MockCollection()

db = MockDatabase()

# First seed
count = seed_experiences(db=db)
coll = db.experiences
assert coll.count_documents({}) == 10, "Should have inserted 10 docs"

# Second seed (idempotency check)
count = seed_experiences(db=db)
assert coll.count_documents({}) == 10, "Should still have 10 docs after second seed (idempotent upsert)"

print("Idempotency verification passed successfully!")
