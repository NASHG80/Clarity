from pymongo import MongoClient
from dotenv import load_dotenv
import os
load_dotenv('c:/Users/jeeta/Documents/Clarity/backend/.env')
client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
db = client[os.getenv('MONGO_DB_NAME', 'green_travel')]

db.hotels.update_many({'name': 'The Emerald Forest Retreat'}, {'$set': {'rules': {'checkIn': '14:00', 'checkOut': '11:00', 'petsAllowed': False, 'smokingAllowed': False, 'partiesAllowed': False, 'cancellationPolicy': 'strict', 'customRules': ['Quiet hours after 10 PM']}}})
db.hotels.update_many({'name': 'Seascape Eco Boutique'}, {'$set': {'rules': {'checkIn': '14:00', 'checkOut': '12:00', 'petsAllowed': True, 'smokingAllowed': False, 'partiesAllowed': True, 'cancellationPolicy': 'flexible', 'customRules': []}}})
db.hotels.update_many({'name': 'Heritage Haveli Green'}, {'$set': {'rules': {'checkIn': '15:00', 'checkOut': '11:00', 'petsAllowed': False, 'smokingAllowed': False, 'partiesAllowed': False, 'cancellationPolicy': 'moderate', 'customRules': ['Traditional attire for dining']}}})
print('Added structured rules objects to dummy properties!')
