from pymongo import MongoClient
from dotenv import load_dotenv
import os
load_dotenv('c:/Users/jeeta/Documents/Clarity/backend/.env')
client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
db = client[os.getenv('MONGO_DB_NAME', 'green_travel')]

photos_emerald = [
    'https://images.unsplash.com/photo-1542314831-c6a4d27ce66f?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000'
]
db.hotels.update_many({'name': 'The Emerald Forest Retreat'}, {'$set': {'photos': photos_emerald}})

photos_seascape = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000'
]
db.hotels.update_many({'name': 'Seascape Eco Boutique'}, {'$set': {'photos': photos_seascape}})

photos_haveli = [
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1598928506311-c55dd1b453e9?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=1000'
]
db.hotels.update_many({'name': 'Heritage Haveli Green'}, {'$set': {'photos': photos_haveli}})

print('Added more photos to dummy properties!')
