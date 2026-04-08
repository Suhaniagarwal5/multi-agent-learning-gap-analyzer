import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = "text-embedding-004"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={api_key}"

payload = {
    "model": f"models/{model}",
    "content": {"parts": [{"text": "Hello, this is a test."}]}
}

print("Pinging Google Servers...")
response = requests.post(url, json=payload)

print(f"\nSTATUS CODE: {response.status_code}")
if response.status_code == 200:
    print("✅ SUCCESS! Google ne embedding accept kar li.")
else:
    print("❌ ERROR FROM GOOGLE:")
    print(response.json())