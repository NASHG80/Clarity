import sys, asyncio, urllib.request, json
sys.path.append('c:/Users/jeeta/Documents/Clarity/backend')

# Test the running backend's proxy endpoint directly
try:
    url = "http://localhost:8000/proxy/directions?origin=15.111,74.222&destination=15.3,74.1&mode=driving"
    res = urllib.request.urlopen(url, timeout=15)
    data = json.loads(res.read())
    print("Proxy directions response:")
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
