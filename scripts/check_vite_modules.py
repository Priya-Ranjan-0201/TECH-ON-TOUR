import urllib.request
import re

visited = set()
to_visit = ['/src/main.tsx', '/src/App.tsx']
errors = []

while to_visit:
    path = to_visit.pop(0)
    if path in visited:
        continue
    visited.add(path)
    url = f'http://localhost:5173{path}'
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            matches = re.findall(r'from\s+["\'](/src/[^"\']+)["\']', content)
            matches += re.findall(r'import\(["\'](/src/[^"\']+)["\']\)', content)
            for m in matches:
                if m not in visited and m not in to_visit:
                    to_visit.append(m)
    except Exception as e:
        errors.append((path, str(e)))

print(f"Visited {len(visited)} modules.")
if errors:
    print("Errors encountered:")
    for p, err in errors:
        print(f"  {p}: {err}")
else:
    print("All visited modules compiled with 200 OK!")
