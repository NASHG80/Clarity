import pytest
import respx
import httpx
from httpx import Response
import os
os.environ["SERPAPI_API_KEY"] = "mock_key"
os.environ["RAILRADAR_API_KEY"] = "mock_key"
os.environ["SERPAPI_ENABLED"] = "true"
os.environ["RAILRADAR_ENABLED"] = "true"
os.environ["LIVE_TRAVEL_DATA_ENABLED"] = "true"

from app.services.live_api import fetch_serpapi_flights, fetch_railradar_trains, api_cache
import datetime

@pytest.fixture(autouse=True)
def reset_cache():
    api_cache.cache.clear()

@pytest.mark.asyncio
@respx.mock
async def test_serpapi_flight_success():
    respx.get("https://serpapi.com/search").mock(return_value=Response(200, json={
        "best_flights": [
            {"flight_token": "f1", "price": 5000, "total_duration": 120}
        ]
    }))
    
    flights = await fetch_serpapi_flights("BOM", "DEL", "2026-10-01")
    assert len(flights) == 1
    assert flights[0]["id"] == "f1"
    assert flights[0]["cost_inr"] == 5000
    assert flights[0]["source"] == "live"
    assert flights[0]["accessibility"]["data_state"] == "not_verified"
    
@pytest.mark.asyncio
@respx.mock
async def test_serpapi_timeout_fallback():
    respx.get("https://serpapi.com/search").mock(side_effect=httpx.TimeoutException)
    
    flights = await fetch_serpapi_flights("BOM", "DEL", "2026-10-01")
    assert len(flights) == 0

@pytest.mark.asyncio
@respx.mock
async def test_railradar_401():
    respx.get(url__regex=r"https://api\.railradar\.in/.*").mock(return_value=Response(401))
    
    trains = await fetch_railradar_trains("CSTM", "MAO", "2026-10-01")
    assert len(trains) == 0

@pytest.mark.asyncio
@respx.mock
async def test_cache_hit():
    route = respx.get("https://serpapi.com/search").mock(return_value=Response(200, json={
        "best_flights": [{"flight_token": "f2", "price": 4000, "total_duration": 100}]
    }))
    
    f1 = await fetch_serpapi_flights("DEL", "BOM", "2026-11-01")
    f2 = await fetch_serpapi_flights("DEL", "BOM", "2026-11-01")
    
    assert len(f1) == 1
    assert len(f2) == 1
    assert route.call_count == 1 # cached
