from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv('c:/Users/jeeta/Documents/Clarity/backend/.env')
client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
db = client[os.getenv('MONGO_DB_NAME', 'green_travel')]

default_photos = [
    'https://images.unsplash.com/photo-1542314831-c6a4d27ce66f?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000'
]

db.hotels.update_many(
    {'$or': [{'photos': {'$exists': False}}, {'photos': {'$size': 0}}]},
    {'$set': {'photos': default_photos}}
)
print('Added fallback photos to all properties missing them!')
