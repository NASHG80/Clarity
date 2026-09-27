import sys
sys.path.append('c:/Users/jeeta/Documents/Clarity/backend')
import httpx, asyncio, os
from dotenv import load_dotenv
load_dotenv('c:/Users/jeeta/Documents/Clarity/backend/.env')

GMAPS_KEY = os.getenv("GOOGLE_ROUTES_API_KEY", "")
print(f"Key: {GMAPS_KEY[:20]}...")

async def test_directions():
    # Test Routes API v2
    payload = {
        "origin": {"location": {"latLng": {"latitude": 15.111, "longitude": 74.222}}},
        "destination": {"location": {"latLng": {"latitude": 15.3, "longitude": 74.1}}},
        "travelMode": "DRIVE",
        "computeAlternativeRoutes": False,
        "units": "METRIC"
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            json=payload,
            headers={
                "X-Goog-Api-Key": GMAPS_KEY,
                "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters"
            }
        )
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:500]}")

    # Also test legacy Directions API
    async with httpx.AsyncClient(timeout=15) as client:
        resp2 = await client.get(
            "https://maps.googleapis.com/maps/api/directions/json",
            params={
                "origin": "15.111,74.222",
                "destination": "15.3,74.1",
                "mode": "driving",
                "key": GMAPS_KEY
            }
        )
    print(f"\nLegacy Directions Status: {resp2.status_code}")
    data2 = resp2.json()
    print(f"Status field: {data2.get('status')}")
    if data2.get('routes'):
        print(f"Route found! Leg distance: {data2['routes'][0]['legs'][0]['distance']['text']}")

asyncio.run(test_directions())
