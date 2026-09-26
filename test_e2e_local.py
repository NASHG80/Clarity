import os
import sys
import json
import io
import time
from PIL import Image

sys.path.insert(0, os.path.abspath("backend"))
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)
os.environ["VISION_SERVICE_URL"] = "http://localhost:8000"

img_byte_arr = io.BytesIO()
Image.new('RGB', (320, 320), color='grey').save(img_byte_arr, format='JPEG')
img_byte_arr = img_byte_arr.getvalue()

files = {"file": ("test.jpg", img_byte_arr, "image/jpeg")}
queries = json.dumps(["wheelchair ramp", "grab bars"])

print("Sending E2E request to backend -> vision-service...")
try:
    response = client.post("/api/ai/inspect-property-image", files=files, data={"queries": queries})
    print("Status Code:", response.status_code)
    print("Response JSON:", json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Failed to connect or test: {e}")
