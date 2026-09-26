import httpx
import json

def test_transport():
    payload = {
        "origin": "Mumbai",
        "destination": "Goa",
        "budget_max": 20000,
        "time_max_hours": 10,
        "accessibility_required": [],
        "include_unverified": True
    }
    resp = httpx.post("http://localhost:8080/api/search/transport", json=payload)
    print("Transport Status:", resp.status_code)
    data = resp.json()
    print("Transport Count:", len(data.get("results", [])))
    for r in data.get("results", [])[:3]:
        print(f"  - {r.get('mode')} {r.get('id')} (Source: {r.get('source')})")
        
def test_accommodation():
    payload = {
        "destination_city": "Goa",
        "budget_max": 20000,
        "accessibility_required": [],
        "include_unverified": True
    }
    resp = httpx.post("http://localhost:8080/api/search/accommodation", json=payload)
    print("Accommodation Status:", resp.status_code)
    data = resp.json()
    print("Accommodation Count:", len(data.get("results", [])))
    for r in data.get("results", [])[:3]:
        print(f"  - {r.get('name')} {r.get('id')} (Source: {r.get('source')})")

if __name__ == "__main__":
    test_transport()
    test_accommodation()
