import requests
import os
from dotenv import load_dotenv

load_dotenv('backend/.env', override=True)

print("========================================")
print("TESTING USER-PROVIDED API CREDENTIALS")
print("========================================")

# 1. OpenWeatherMap
weather_key = os.getenv('OPENWEATHER_API_KEY')
print(f"\n1. OpenWeatherMap Key ({weather_key[:6]}...):")
try:
    r_w = requests.get(f"https://api.openweathermap.org/data/2.5/weather?q=Delhi,IN&appid={weather_key}&units=metric", timeout=15)
    print(f"   Status: {r_w.status_code}")
    if r_w.status_code == 200:
        data = r_w.json()
        desc = data.get('weather', [{}])[0].get('description')
        temp = data.get('main', {}).get('temp')
        print(f"   [SUCCESS] Live Delhi Weather: {desc}, {temp}°C")
    else:
        print(f"   [NOTE] Response: {r_w.text}")
except Exception as e:
    print(f"   [ERROR]: {e}")

# 2. Groq
groq_key = os.getenv('GROQ_API_KEY')
print(f"\n2. Groq API Key ({groq_key[:8]}...):")
try:
    r_g = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
        json={
            "model": "qwen/qwen3.8-27b",
            "messages": [{"role": "user", "content": "Hello TravelSathi in 5 words"}],
            "max_tokens": 20
        },
        timeout=15
    )
    print(f"   Status: {r_g.status_code}")
    if r_g.status_code == 200:
        content = r_g.json()['choices'][0]['message']['content'].strip()
        print(f"   [SUCCESS] Groq Qwen-3.8-27b Reply: \"{content}\"")
    else:
        print(f"   [FAILED] Response: {r_g.text}")
except Exception as e:
    print(f"   [ERROR]: {e}")

# 3. OpenRouteService
ors_key = os.getenv('ORS_API_KEY')
print(f"\n3. OpenRouteService Key ({ors_key[:12]}...):")
try:
    headers = {"Authorization": ors_key, "Content-Type": "application/json"}
    body = {"coordinates": [[77.2090, 28.6139], [77.1887, 32.2396]]}
    r_o = requests.post("https://api.openrouteservice.org/v2/directions/driving-car", json=body, headers=headers, timeout=15)
    print(f"   Status: {r_o.status_code}")
    if r_o.status_code == 200:
        dist_km = r_o.json()['routes'][0]['summary']['distance'] / 1000.0
        dur_min = r_o.json()['routes'][0]['summary']['duration'] / 60.0
        print(f"   [SUCCESS] Real Driving Route (Delhi to Manali): {dist_km:.1f} km, {dur_min:.0f} min")
    else:
        print(f"   [FAILED] Response: {r_o.text}")
except Exception as e:
    print(f"   [ERROR]: {e}")

# 4. Gemini
gemini_key = os.getenv('GEMINI_API_KEY')
print(f"\n4. Google Gemini Key ({gemini_key[:8]}...):")
try:
    r_gem = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={gemini_key}",
        headers={"Content-Type": "application/json"},
        json={"contents": [{"parts": [{"text": "Hello TravelSathi in 5 words"}]}]},
        timeout=15
    )
    print(f"   Status: {r_gem.status_code}")
    if r_gem.status_code == 200:
        reply = r_gem.json()['candidates'][0]['content']['parts'][0]['text'].strip()
        print(f"   [SUCCESS] Gemini 3.6 Flash Reply: \"{reply}\"")
    else:
        print(f"   [NOTICE] Response: {r_gem.text}")
except Exception as e:
    print(f"   [ERROR]: {e}")
