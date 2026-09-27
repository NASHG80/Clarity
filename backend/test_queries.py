import urllib.request
import json
import ssl

def test_query(q):
    try:
        url = f'https://api.railradar.in/v1/lookup/search/stations?q={urllib.parse.quote(q)}&limit=50'
        req = urllib.request.Request(url, headers={'Authorization': 'Bearer rg_28033cf6ebd347b79aff5c71d1d8f9cd'})
        context = ssl._create_unverified_context()
        resp = urllib.request.urlopen(req, context=context)
        data = json.loads(resp.read().decode('utf-8'))
        results = data.get('data', [])
        print(f"Q: {q:10} | success: {data.get('success')} | results: {len(results)}")
        if results:
             print("   Example:", results[0])
    except Exception as e:
        print(f"Q: {q:10} | ERROR: {e}")

import urllib.parse
for q in ['Mumbai', 'Delhi', 'Borivali', 'Ratnagiri', 'Pune', 'Surat', 'Ahmedabad', 'Nagpur', 'Indore', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'LTT', 'BVI', 'MMCT', 'NDLS', 'PUNE']:
    test_query(q)
