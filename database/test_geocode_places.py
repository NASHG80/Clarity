import sys, asyncio, urllib.request, json, urllib.parse
sys.path.append('c:/Users/jeeta/Documents/Clarity/backend')

# Test geocode proxy with a real address
address = "Verlem, Netravali Wildlife Sanctuary, Goa 403704"
encoded = urllib.parse.quote(address)
url = f"http://localhost:8000/proxy/geocode?address={encoded}"

try:
    res = urllib.request.urlopen(url, timeout=15)
    data = json.loads(res.read())
    print(f"Geocode status: {data.get('status')}")
    if data.get('results'):
        loc = data['results'][0]['geometry']['location']
        print(f"Coords: {loc}")
    else:
        print("No results!")
except Exception as e:
    print(f"Error: {e}")

# Test places proxy  
print("\n--- Testing places proxy ---")
url2 = "http://localhost:8000/proxy/places?lat=15.111&lng=74.222&radius=8000&type=tourist_attraction"
try:
    res2 = urllib.request.urlopen(url2, timeout=15)
    data2 = json.loads(res2.read())
    print(f"Places status: {data2.get('status')}")
    print(f"Number of results: {len(data2.get('results', []))}")
    if data2.get('results'):
        print(f"First result: {data2['results'][0]['name']}")
except Exception as e:
    print(f"Error: {e}")
