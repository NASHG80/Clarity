import sys
sys.path.append('c:/Users/jeeta/Documents/Clarity/backend')
from app.db.mongo import get_db, get_mongo_client

db = get_db()
print(f'Connected to DB: {db.name}')

keep_names = ['The Emerald Forest Retreat', 'Seascape Eco Boutique', 'Heritage Haveli Green']

res = db.hotels.delete_many({
    '$and': [
        {'name': {'$nin': keep_names}},
        {'translations.en.name': {'$nin': keep_names}}
    ]
})
print(f'Deleted {res.deleted_count} properties.')
