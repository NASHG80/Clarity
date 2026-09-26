import os
import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.services.live_api import railradar_autocomplete, google_places_autocomplete

async def main():
    print(await railradar_autocomplete("LTT"))
    print(await google_places_autocomplete("BOM airport"))

if __name__ == "__main__":
    asyncio.run(main())
