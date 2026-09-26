# AI Services

GPU-isolated, separately-run services. Currently: `vision-service`
(YOLO-World-S for B2B photo analysis). See docs/TECH_STACK.md.

## Vision Service Setup

The vision service uses Ultralytics YOLO-World-S to identify candidate accessibility items in property photos. Note that the AI's confidence is NEVER exposed as a traveler-facing accessibility score.

### 1. Installation
Install the project dependencies:
```bash
pip install -r ai-services/vision-service/requirements.txt
```

### 2. Model Setup
Do not commit the model weights to source control. They are ignored in `.gitignore`.
Run the idempotent setup script to download the model into the `model/` directory:
```bash
python ai-services/vision-service/setup_model.py
```
This will download `yolo-world-s.pt` to `ai-services/vision-service/model/`.

### 3. Configuration
The model path is configurable via the `.env` file (see `.env.example`):
```text
MODEL_PATH=./model/yolo-world-s.pt
```
Ensure you run commands from `ai-services/vision-service/` or the project root. Relative paths are resolved deterministically from the vision-service project directory.

### 4. Smoke Verification
Run the standalone smoke test to verify model loading, verify GPU/VRAM constraints (RTX 5050 8GB limit), and test basic inference without mutating real data.
```bash
python ai-services/vision-service/smoke_test.py
```

### 5. API Usage (D12)
Start the FastAPI inference service using uvicorn:
```bash
cd ai-services/vision-service
uvicorn main:app --port 8000 --reload
```
This runs a standalone service that lazily exposes `POST /inspect` and `GET /health`.

**`GET /health`**
Verifies if the YOLO model is loaded. Returns `{"status": "ok"}` or 503 if not loaded.

**`POST /inspect`**
Upload a property image and a JSON-encoded list of queries (e.g. `["wheelchair ramp"]`).
```bash
curl -X POST http://localhost:8000/inspect \
  -F "file=@/path/to/image.jpg" \
  -F 'queries=["wheelchair ramp", "grab bars"]'
```

**Expected Response Shape:**
```json
{
  "detections": [
    {
      "label": "wheelchair ramp",
      "bbox": [120.0, 50.0, 200.0, 150.0],
      "confidence": 0.82
    }
  ]
}
```

### 6. Image Validation and Warmup (D13)
The service implements safe deterministic limits before reaching inference:
- **Maximum Upload Size:** 5MB
- **Accepted Formats:** JPEG, PNG (MIME types `image/jpeg` and `image/png`).
- **Data Integrity:** Files are fully decoded internally to detect truncation and absurd dimension errors. Abusive sizes correctly trigger a `413 Request Entity Too Large` error, while unreadable files throw a `400 Bad Request`.
- **Startup Warmup:** The YOLO-World-S model is explicitly warmed into memory (and VRAM if CUDA is available) via a deterministic synthetic image at `lifespan` load time. The `/health` endpoint strictly guarantees model availability and warmup success, gracefully reflecting a degraded `503` if startup dependencies fail.

**Important Notes:**
- **Confidence is Internal:** The confidence field is purely a numeric engineering signal. It is NEVER used as an accessibility score or percentage.
- **No Database Mutation:** Detections returned by this service are mere candidates. This API does not mutate MongoDB records, hotel states, or any checklist.
- The backend integration route (`/api/ai/inspect-property-image`) is outside the scope of this vision service module.
