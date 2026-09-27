import sys
sys.path.append('c:/Users/jeeta/Documents/Clarity/backend')
from app.db.mongo import get_db

db = get_db()
print(f'Connected to DB: {db.name}')

for h in db.hotels.find():
    name = h.get('name') or h.get('translations', {}).get('en', {}).get('name', 'Unknown')
    photos = h.get('photos', [])
    reviews = h.get('reviews', [])
    rooms = h.get('rooms', [])
    rules = h.get('rules', {})
    print(f"{name}: {len(photos)} photos, {len(reviews)} reviews, {len(rooms)} rooms, has_rules: {bool(rules)}")
