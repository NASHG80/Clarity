import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv("backend/.env")
RAILRADAR_API_KEY = os.getenv("RAILRADAR_API_KEY")

def test_railradar():
    print("Testing RailRadar...")
    headers = {"Authorization": f"Bearer {RAILRADAR_API_KEY}"}
    params = {"date": "2026-10-01", "live": "false"}
    
    try:
        resp = httpx.get("https://api.railradar.in/v1/trains/between/CSTM/MAO", headers=headers, params=params, timeout=10)
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
    test_railradar()
