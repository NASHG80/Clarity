import httpx
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
from app.services.journey_builder import _get_google_route

async def test():
    res = await _get_google_route("Mumbai", "Goa", "DRIVE")
    print(res)

if __name__ == "__main__":
    asyncio.run(test())
