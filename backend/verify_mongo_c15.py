import os
from pymongo import MongoClient
import requests
from datetime import datetime, timedelta, timezone

def run():
    client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    db = client["green_inclusive_travel"]
    
    # 1. Clean up old data
    db.businesses.delete_one({"_id": "biz_manual_test"})
    db.hotels.delete_one({"_id": "hotel_manual_test"})
    db.analytics_events.delete_many({"business_id": "biz_manual_test"})
    
    # 2. Insert test business and hotel
    db.businesses.insert_one({"_id": "biz_manual_test", "hotel_id": "hotel_manual_test"})
    db.hotels.insert_one({"_id": "hotel_manual_test", "data_state": "reported"})
    
    now = datetime.now(timezone.utc)
    recent = (now - timedelta(hours=1)).isoformat()
    
    # 3. Insert duplicate events in the same session
    events = [
        # Session 1 (duplicate detail opens)
        {"business_id": "biz_manual_test", "listing_id": "h_1", "session_id": "s1", "event_type": "listing_impression", "timestamp": recent},
        {"business_id": "biz_manual_test", "listing_id": "h_1", "session_id": "s1", "event_type": "detail_open", "timestamp": recent},
        {"business_id": "biz_manual_test", "listing_id": "h_1", "session_id": "s1", "event_type": "detail_open", "timestamp": recent},
        {"business_id": "biz_manual_test", "listing_id": "h_1", "session_id": "s1", "event_type": "detail_open", "timestamp": recent},
        {"business_id": "biz_manual_test", "listing_id": "h_1", "session_id": "s1", "event_type": "accessibility_view", "timestamp": recent},
        
        # Session 2
        {"business_id": "biz_manual_test", "listing_id": "h_1", "session_id": "s2", "event_type": "detail_open", "timestamp": recent},
        {"business_id": "biz_manual_test", "listing_id": "h_1", "session_id": "s2", "event_type": "booking_start", "timestamp": recent},
    ]
    
    db.analytics_events.insert_many(events)
    print("Inserted seed data to MongoDB.")
    
    # 4. Make GET request to local backend
    resp = requests.get("http://127.0.0.1:8000/api/business/biz_manual_test/analytics")
    
    print("\nAPI STATUS:", resp.status_code)
    print("API RESPONSE:")
    import json
    print(json.dumps(resp.json(), indent=2))
    
if __name__ == "__main__":
    run()
