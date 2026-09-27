import asyncio
from app.services.journey_builder import build_train_journeys, build_flight_journeys, build_car_journeys

async def main():
    print("Testing train journeys")
    trains = await build_train_journeys("Mumbai", "Goa", "2026-10-01")
    print(len(trains))

    print("Testing flight journeys")
    flights = await build_flight_journeys("Mumbai", "Goa", "2026-10-01")
    print(len(flights))

    print("Testing car journeys")
    cars = await build_car_journeys("Mumbai", "Goa")
    print(len(cars))

if __name__ == "__main__":
    asyncio.run(main())
