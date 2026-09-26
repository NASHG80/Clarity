import requests
import io
from PIL import Image

def test_backend_proxy():
    # Create dummy image
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    url = "http://localhost:8080/api/ai/inspect-property-image"
    files = {'file': ('dummy.jpg', img_byte_arr, 'image/jpeg')}
    data = {'queries': '["wheelchair ramp"]'}
    
    print(f"Sending POST to {url}...")
    try:
        response = requests.post(url, files=files, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_backend_proxy()
