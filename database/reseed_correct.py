import sys
sys.path.append('c:/Users/jeeta/Documents/Clarity/backend')
from app.db.mongo import get_db

db = get_db()
print(f'Connected to DB: {db.name}')

dummy_hotels = [
    {
        "name": "The Emerald Forest Retreat",
        "city": "Goa",
        "price_inr_per_night": 14500,
        "star_rating": 5,
        "data_state": "verified",
        "photos": [
            "https://images.unsplash.com/photo-1542314831-c6a4d27ce66f?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000"
        ],
        "rooms": [
            {
                "type": "Premium Eco Suite",
                "price": 14500,
                "amenities": ["Balcony", "Free WiFi", "Breakfast Included"],
                "photos": ["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800"]
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
        "rules": {
            "checkIn": "14:00",
            "checkOut": "11:00",
            "petsAllowed": False,
            "smokingAllowed": False,
            "partiesAllowed": False,
            "cancellationPolicy": "strict",
            "customRules": ["Quiet hours after 10 PM"]
        },
        "reviews": [
            {
                "author": "Rahul S.",
                "rating": 5,
                "date": "August 2026",
                "text": "Absolutely incredible stay! The eco-friendly initiatives were clearly visible."
            }
        ],
        "translations": {
            "en": {
                "name": "The Emerald Forest Retreat",
                "description": "An eco-luxury oasis nestled in the lush forests of Goa."
            }
        }
    },
    {
        "name": "Seascape Eco Boutique",
        "city": "Mumbai",
        "price_inr_per_night": 9500,
        "star_rating": 4,
        "data_state": "reported",
        "photos": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000"
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
        "rules": {
            "checkIn": "14:00",
            "checkOut": "12:00",
            "petsAllowed": True,
            "smokingAllowed": False,
            "partiesAllowed": True,
            "cancellationPolicy": "flexible",
            "customRules": []
        },
        "reviews": [
            {
                "author": "Priya M.",
                "rating": 4,
                "date": "July 2026",
                "text": "Great location and wonderful amenities. Loved the zero-waste policy."
            }
        ],
        "translations": {
            "en": {
                "name": "Seascape Eco Boutique",
                "description": "A stunning eco-conscious boutique hotel facing the Arabian Sea."
            }
        }
    },
    {
        "name": "Heritage Haveli Green",
        "city": "Delhi",
        "price_inr_per_night": 12000,
        "star_rating": 4,
        "data_state": "verified",
        "photos": [
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1598928506311-c55dd1b453e9?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=1000"
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
            {"label": "step_free_entrance", "value": True, "data_state": "verified"},
            {"label": "accessible_parking", "value": True, "data_state": "verified"}
        ],
        "sustainability_items": [
            {"label": "water_efficiency", "value": True, "data_state": "verified"},
            {"label": "heritage_conservation", "value": True, "data_state": "verified"}
        ],
        "amenities": ["Heritage Walks", "Vegetarian Restaurant", "Library"],
        "rules": {
            "checkIn": "15:00",
            "checkOut": "11:00",
            "petsAllowed": False,
            "smokingAllowed": False,
            "partiesAllowed": False,
            "cancellationPolicy": "moderate",
            "customRules": ["Traditional attire for dining"]
        },
        "reviews": [
            {
                "author": "Arun K.",
                "rating": 5,
                "date": "September 2026",
                "text": "Felt like royalty. The heritage conservation efforts here are inspiring."
            }
        ],
        "translations": {
            "en": {
                "name": "Heritage Haveli Green",
                "description": "Experience sustainable royalty in the heart of Delhi."
            }
        }
    }
]

db.hotels.delete_many({})
db.hotels.insert_many(dummy_hotels)
print("Successfully seeded robust dummy data into the actual Clarity DB.")
