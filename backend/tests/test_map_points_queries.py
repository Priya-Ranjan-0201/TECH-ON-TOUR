import urllib.request
import json

for city in ['goa', 'delhi', 'jaipur', 'manali']:
    url = f'http://127.0.0.1:8000/api/destinations/map-points?q={city}&limit=500'
    res = urllib.request.urlopen(url)
    data = json.loads(res.read().decode())
    points = data.get('points', [])
    print(f"{city}: count={data.get('count')}, sample={points[0]['name'] if points else None}, state={points[0]['state'] if points else None}")
