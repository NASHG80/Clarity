from pymongo import MongoClient
import os
client = MongoClient('mongodb://localhost:27017')
db = client['green_travel']

keep_names = ["The Emerald Forest Retreat", "Seascape Eco Boutique", "Heritage Haveli Green"]

# Delete any property whose name is NOT in keep_names, nor is its translations.en.name in keep_names
res = db.hotels.delete_many({
    "$and": [
        {"name": {"$nin": keep_names}},
        {"translations.en.name": {"$nin": keep_names}}
    ]
})
print(f"Deleted {res.deleted_count} properties.")
