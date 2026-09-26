import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv("backend/.env")

SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
RAILRADAR_API_KEY = os.getenv("RAILRADAR_API_KEY")

def test_serpapi():
    print("Testing SerpApi...")
    # Demo query: Flight from Mumbai (BOM) to Goa (GOI)
    params = {
        "engine": "google_flights",
        "departure_id": "BOM",
        "arrival_id": "GOI",
        "outbound_date": "2026-10-01",
        "type": "2",
        "currency": "INR",
        "hl": "en",
        "api_key": SERPAPI_API_KEY
    }
    resp = httpx.get("https://serpapi.com/search", params=params)
    print("SerpApi Status:", resp.status_code)
    if resp.status_code == 200:
        with open("backend/tests/fixtures/serpapi_flights.json", "w") as f:
            json.dump(resp.json(), f, indent=2)
    else:
        print("SerpApi Response:", resp.text)

def test_railradar():
    print("Testing RailRadar...")
    # Demo query: Trains from Mumbai to Goa
    # Mumbai CST is CSTM, Goa is MAO (Madgaon)
    headers = {"Authorization": f"Bearer {RAILRADAR_API_KEY}"}
    params = {"date": "2026-10-01", "live": "false"}
    
    # Try api.railradar.com (assuming standard domain)
    # If this fails, maybe it's railradar.in or something? I'll check response.
    try:
        resp = httpx.get("https://api.railradar.com/v1/trains/between/CSTM/MAO", headers=headers, params=params, timeout=10)
        print("RailRadar Status:", resp.status_code)
        if resp.status_code == 200:
            with open("backend/tests/fixtures/railradar_trains.json", "w") as f:
                json.dump(resp.json(), f, indent=2)
        else:
            print("RailRadar Response:", resp.text)
    except Exception as e:
        print("RailRadar Error:", e)

if __name__ == "__main__":
    os.makedirs("backend/tests/fixtures", exist_ok=True)
    test_serpapi()
    test_railradar()
