from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
import os

load_dotenv("c:/Users/jeeta/Documents/Clarity/backend/.env")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "green_travel")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

dummy_hotels = [
    {
        "_id": ObjectId(),
        "name": "The Emerald Forest Retreat",
        "city": "Goa",
        "price_inr_per_night": 14500,
        "star_rating": 5,
        "data_state": "verified",
        "photos": [
            "https://images.unsplash.com/photo-1542314831-c6a4d27ce66f?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000"
        ],
        "rooms": [
            {
                "type": "Forest View Suite",
                "price": 14500,
                "amenities": ["Balcony", "Free WiFi", "Breakfast Included"],
                "photos": ["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800"]
            },
            {
                "type": "Poolside Villa",
                "price": 22000,
                "amenities": ["Private Pool", "Butler Service"],
                "photos": ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800"]
            }
        ],
        "accessibility_items": [
            {"label": "step_free_entrance", "value": True, "data_state": "verified"},
            {"label": "accessible_toilet", "value": True, "data_state": "verified"},
            {"label": "roll_in_shower", "value": True, "data_state": "verified"},
            {"label": "wheelchair_friendly_paths", "value": True, "data_state": "verified"}
        ],
        "sustainability_items": [
            {"label": "waste_management", "value": True, "data_state": "verified"},
            {"label": "renewable_energy", "value": True, "data_state": "verified"},
            {"label": "water_efficiency", "value": True, "data_state": "verified"},
            {"label": "local_sourcing", "value": True, "data_state": "reported"}
        ],
        "amenities": ["Spa", "Gym", "Yoga Pavilion", "Organic Restaurant"],
        "property_rules": ["No smoking inside", "Quiet hours after 10 PM"],
        "translations": {
            "en": {
                "name": "The Emerald Forest Retreat",
                "description": "An eco-luxury oasis nestled in the lush forests of Goa."
            },
            "hi": {
                "name": "एमराल्ड फॉरेस्ट रिट्रीट",
                "description": "गोवा के हरे-भरे जंगलों में स्थित एक ईको-लक्ज़री ओएसिस।"
            },
            "mr": {
                "name": "एमराल्ड फॉरेस्ट रिट्रीट",
                "description": "गोव्याच्या हिरव्यागार जंगलात वसलेले एक इको-लक्झरी ओएसिस."
            }
        }
    },
    {
        "_id": ObjectId(),
        "name": "Seascape Eco Boutique",
        "city": "Mumbai",
        "price_inr_per_night": 9500,
        "star_rating": 4,
        "data_state": "reported",
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=1000"
        ],
        "rooms": [
            {
                "type": "Ocean Breeze Room",
                "price": 9500,
                "amenities": ["Sea View", "AC", "Free WiFi"],
                "photos": ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=800"]
            }
        ],
        "accessibility_items": [
            {"label": "step_free_entrance", "value": True, "data_state": "reported"},
            {"label": "elevator", "value": True, "data_state": "reported"}
        ],
        "sustainability_items": [
            {"label": "plastic_free", "value": True, "data_state": "reported"},
            {"label": "waste_management", "value": True, "data_state": "reported"}
        ],
        "amenities": ["Beachfront", "Seafood Restaurant", "Concierge"],
        "property_rules": ["Pets allowed", "Check-in at 2 PM"],
        "translations": {
            "en": {
                "name": "Seascape Eco Boutique",
                "description": "A stunning eco-conscious boutique hotel facing the Arabian Sea."
            }
        }
    },
    {
        "_id": ObjectId(),
        "name": "Heritage Haveli Green",
        "city": "Delhi",
        "price_inr_per_night": 12000,
        "star_rating": 4,
        "data_state": "community_confirmed",
        "photos": [
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000"
        ],
        "rooms": [
            {
                "type": "Royal Suite",
                "price": 12000,
                "amenities": ["King Bed", "Courtyard View"],
                "photos": ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800"]
            }
        ],
        "accessibility_items": [
            {"label": "step_free_entrance", "value": True, "data_state": "community_confirmed"},
            {"label": "accessible_parking", "value": True, "data_state": "community_confirmed"}
        ],
        "sustainability_items": [
            {"label": "water_efficiency", "value": True, "data_state": "verified"},
            {"label": "heritage_conservation", "value": True, "data_state": "verified"}
        ],
        "amenities": ["Heritage Walks", "Vegetarian Restaurant", "Library"],
        "property_rules": ["No loud music", "Traditional attire for dining"],
        "translations": {
            "en": {
                "name": "Heritage Haveli Green",
                "description": "Experience sustainable royalty in the heart of Delhi."
            }
        }
    }
]

print("Deleting old dummy listings (if any)...")
# Delete properties with our known names to prevent duplicates during testing
db.hotels.delete_many({"name": {"$in": [h["name"] for h in dummy_hotels]}})

print("Seeding premium dummy properties...")
db.hotels.insert_many(dummy_hotels)
print("Successfully seeded 3 premium dummy properties into 'hotels' collection.")
