import sys
from pathlib import Path
import os
import pymongo
import re

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Load .env manually for diagnostic if needed
try:
    from dotenv import load_dotenv
    env_path = PROJECT_ROOT / "backend" / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

from backend.app.db.mongo import get_mongo_client, get_db

def mask_uri(uri):
    # Mask username:password in mongodb+srv://username:password@cluster...
    return re.sub(r'(mongodb(?:\+srv)?://)[^:]+:[^@]+@', r'\1***:***@', uri)

def main():
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGO_DB_NAME", "green_travel")
    
    print("=== Database Connection Diagnostic ===")
    masked = mask_uri(uri)
    print(f"Configured URI: {masked}")
    print(f"Targeting Database: {db_name}")
    
    if "localhost" in uri or "127.0.0.1" in uri:
        print("Target: local")
    elif "mongodb.net" in uri or "atlas" in uri:
        print("Target: Atlas")
    else:
        print("Target: Unknown")
        
    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Force a connection
        client.admin.command('ping')
        print("Ping: SUCCESS")
        
        db = client.get_default_database(default=db_name)
        
        colls = db.list_collection_names()
        print(f"\nCollections in '{db.name}': {colls}")
        
        expected_colls = [
            "hotels", "transport_routes", "experiences", 
            "businesses", "confirmations", "analytics_events", 
            "ai_inspections"
        ]
        
        print("\nDocument Counts:")
        for coll in expected_colls:
            if coll in colls:
                count = db[coll].count_documents({})
                print(f"{coll}: {count}")
            else:
                print(f"{coll}: 0 (collection missing)")
                
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()
