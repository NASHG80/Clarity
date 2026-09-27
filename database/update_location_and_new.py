import sys
sys.path.append('c:/Users/jeeta/Documents/Clarity/backend')
from app.db.mongo import get_db

db = get_db()
print(f'Connected to DB: {db.name}')

# 1. Update the existing 3 listings with location and address
db.hotels.update_many({"name": "The Emerald Forest Retreat"}, {"$set": {
    "address": "Verlem, Netravali Wildlife Sanctuary, Goa 403704",
    "location": {"lat": 15.111, "lng": 74.222}
}})
db.hotels.update_many({"name": "Seascape Eco Boutique"}, {"$set": {
    "address": "Juhu Tara Road, Juhu Beach, Mumbai 400049",
    "location": {"lat": 19.098, "lng": 72.826}
}})
db.hotels.update_many({"name": "Heritage Haveli Green"}, {"$set": {
    "address": "Chandni Chowk, Old Delhi, Delhi 110006",
    "location": {"lat": 28.650, "lng": 77.230}
}})

# 2. Add 2 more completely fleshed-out listings
new_hotels = [
    {
        "name": "Himalayan Cloud Peak",
        "city": "Manali",
        "address": "Solang Valley Road, Manali, Himachal Pradesh 175131",
        "location": {"lat": 32.316, "lng": 77.159},
        "price_inr_per_night": 18000,
        "star_rating": 5,
        "data_state": "verified",
        "photos": [
            "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1000"
        ],
        "rooms": [
            {
                "type": "Snow View Chalet",
                "price": 18000,
                "amenities": ["Mountain View", "Fireplace", "Free WiFi"],
                "photos": ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800"]
            }
        ],
        "accessibility_items": [
            {"label": "step_free_entrance", "value": True, "data_state": "verified"}
        ],
        "sustainability_items": [
            {"label": "solar_heating", "value": True, "data_state": "verified"},
            {"label": "local_sourcing", "value": True, "data_state": "verified"},
            {"label": "plastic_free", "value": True, "data_state": "verified"}
        ],
        "amenities": ["Ski Rental", "Spa", "Library", "Bonfire"],
        "rules": {
            "checkIn": "14:00",
            "checkOut": "11:00",
            "petsAllowed": False,
            "smokingAllowed": False,
            "partiesAllowed": False,
            "cancellationPolicy": "strict",
            "customRules": ["Shoes not allowed inside rooms", "Quiet hours after 9 PM"]
        },
        "reviews": [
            {
                "author": "Anjali P.",
                "rating": 5,
                "date": "December 2025",
                "text": "Breathtaking views and truly exceptional service. The solar-heated rooms kept us warm without hurting the environment!"
            }
        ],
        "translations": {
            "en": {
                "name": "Himalayan Cloud Peak",
                "description": "A luxury ski-resort and eco-chalet offering unobstructed views of the Solang Valley."
            }
        }
    },
    {
        "name": "Kerala Backwater Bliss",
        "city": "Alleppey",
        "address": "Punnamada Lake, Alleppey, Kerala 688006",
        "location": {"lat": 9.510, "lng": 76.341},
        "price_inr_per_night": 7500,
        "star_rating": 4,
        "data_state": "community_confirmed",
        "photos": [
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000"
        ],
        "rooms": [
            {
                "type": "Floating Eco Villa",
                "price": 7500,
                "amenities": ["Lake View", "AC", "Traditional Kerala Breakfast"],
                "photos": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=800"]
            }
        ],
        "accessibility_items": [
            {"label": "wheelchair_friendly_paths", "value": True, "data_state": "community_confirmed"}
        ],
        "sustainability_items": [
            {"label": "waste_management", "value": True, "data_state": "verified"},
            {"label": "water_efficiency", "value": True, "data_state": "verified"},
            {"label": "community_funded", "value": True, "data_state": "reported"}
        ],
        "amenities": ["Ayurvedic Spa", "Houseboat Tour", "Traditional Dining"],
        "rules": {
            "checkIn": "12:00",
            "checkOut": "10:00",
            "petsAllowed": True,
            "smokingAllowed": False,
            "partiesAllowed": False,
            "cancellationPolicy": "moderate",
            "customRules": ["No plastic bottles on board"]
        },
        "reviews": [
            {
                "author": "Karthik R.",
                "rating": 4,
                "date": "February 2026",
                "text": "Such a serene experience. The backwaters are amazing and the local food was the best I've ever had."
            }
        ],
        "translations": {
            "en": {
                "name": "Kerala Backwater Bliss",
                "description": "Drift through the beautiful Kerala backwaters in a 100% sustainable traditional floating villa."
            }
        }
    }
]

# Delete them if they exist to prevent duplicates
db.hotels.delete_many({"name": {"$in": ["Himalayan Cloud Peak", "Kerala Backwater Bliss"]}})
db.hotels.insert_many(new_hotels)
print("Updated existing listings with Locations and inserted 2 new robust listings!")
