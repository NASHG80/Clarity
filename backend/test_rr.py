import httpx
import asyncio

async def test():
    token = "rg_28033cf6ebd347b79aff5c71d1d8f9cd"
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.railradar.in/v1/trains/stations", headers=headers)
        print(resp.json())

if __name__ == "__main__":
    asyncio.run(test())
