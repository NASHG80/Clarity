import sys, asyncio, urllib.request, json
sys.path.append('c:/Users/jeeta/Documents/Clarity/backend')

# Get all listings, then get detail of first one
try:
    res = urllib.request.urlopen('http://localhost:8000/api/listings', timeout=15)
    listings = json.loads(res.read())
    print(f"Total listings: {len(listings)}")
    first = listings[0]
    first_id = first['id']
    print(f"First listing ID: {first_id}")
    print(f"First listing name: {first.get('translations', {}).get('en', {}).get('name', 'N/A')}")
    
    # Get detail
    res2 = urllib.request.urlopen(f'http://localhost:8000/api/listings/{first_id}', timeout=15)
    detail = json.loads(res2.read())
    print(f"\nDetail fields present:")
    print(f"  city: {detail.get('city')}")
    print(f"  address: {detail.get('address')}")
    print(f"  location: {detail.get('location')}")
    print(f"  photos: {len(detail.get('photos', []))} photos")
    print(f"  rooms: {len(detail.get('rooms', []) or [])} rooms")
    print(f"  rules: {bool(detail.get('rules'))}")
    print(f"  reviews: {len(detail.get('reviews', []) or [])} reviews")
    print(f"  amenities: {detail.get('amenities')}")
except Exception as e:
    import traceback
    traceback.print_exc()
