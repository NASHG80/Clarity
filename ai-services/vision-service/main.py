"""POST /inspect — forwards property images to YOLO-World-S, returns detections."""

import os
import json
import numpy as np
import cv2
from pathlib import Path
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 # 5MB
ACCEPTED_MIME_TYPES = {"image/jpeg", "image/png"}

model_instance = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_instance
    try:
        import torch
        from ultralytics import YOLOWorld
        
        model_path_env = os.environ.get("MODEL_PATH", "./model/yolo-world-s.pt")
        script_dir = Path(__file__).resolve().parent
        model_path = (script_dir / model_path_env).resolve()
        
        if not model_path.exists():
            print(f"Warning: Model not found at {model_path}. Service will fail on /inspect calls.")
        else:
            print("Loading YOLO-World-S...")
            model = YOLOWorld(str(model_path))
            cuda_available = torch.cuda.is_available()
            print(f"YOLO-World-S model loaded successfully. CUDA available: {cuda_available}")
            
            print("Warming up model...")
            dummy_img = np.full((320, 320, 3), 128, dtype=np.uint8)
            model.set_classes(["wheelchair ramp"])
            model(dummy_img, verbose=False)
            print("Model warmup complete.")
            
            # Commit to global only if warmup succeeds
            model_instance = model
            
    except ImportError as e:
        print(f"Dependency error during startup: {e}")
        model_instance = None
    except Exception as e:
        print(f"Failed to load/warmup model during startup: {e}")
        model_instance = None
    yield
    model_instance = None

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health_check():
    if model_instance is None:
        return JSONResponse(status_code=503, content={"status": "degraded", "detail": "Model not loaded or warmup failed"})
    return {"status": "ok", "model": "yolo-world-s"}

@app.post("/inspect")
async def inspect_image(file: UploadFile = File(...), queries: str = Form(...)):
    if not model_instance:
        raise HTTPException(status_code=503, detail="Model is not loaded or available.")
    
    if file.content_type not in ACCEPTED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type. Only JPEG and PNG are allowed.")
        
    try:
        query_list = json.loads(queries)
        if not isinstance(query_list, list) or not all(isinstance(q, str) for q in query_list):
            raise ValueError()
        if len(query_list) == 0:
            raise ValueError()
    except Exception:
        raise HTTPException(status_code=400, detail="queries must be a valid JSON list of strings and non-empty.")
        
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image file.")
            
        if len(contents) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail=f"Image file too large. Maximum size is {MAX_IMAGE_SIZE_BYTES} bytes.")
        
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Unreadable or malformed image file.")
            
        if img.shape[0] == 0 or img.shape[1] == 0:
            raise HTTPException(status_code=400, detail="Invalid image dimensions.")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")
        
    try:
        # Avoid inventing new classes, strictly use user's queries
        model_instance.set_classes(query_list)
        results = model_instance(img, verbose=False)
        
        detections = []
        if len(results) > 0:
            result = results[0]
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Normalized bbox to [x1, y1, width, height]
                    xyxy = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = xyxy
                    w = x2 - x1
                    h = y2 - y1
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    label = query_list[cls_id] if cls_id < len(query_list) else "unknown"
                    
                    detections.append({
                        "label": label,
                        "bbox": [x1, y1, w, h],
                        "confidence": conf
                    })
                    
        return {"detections": detections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")
