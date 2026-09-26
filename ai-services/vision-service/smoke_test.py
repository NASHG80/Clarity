import os
import sys
from pathlib import Path
from PIL import Image

try:
    import torch
    from ultralytics import YOLOWorld
except ImportError as e:
    print(f"Failed to import dependencies. Ensure ultralytics and torch are installed. ({e})")
    sys.exit(1)

def run_smoke_test():
    print("=== YOLO-World-S Smoke Test ===")
    
    # 1. Resolve configured model path
    model_path_env = os.environ.get("MODEL_PATH", "./model/yolo-world-s.pt")
    
    # Resolve relative to vision-service directory
    script_dir = Path(__file__).resolve().parent
    model_path = (script_dir / model_path_env).resolve()
    
    if not model_path.exists():
        print(f"FAIL: Model artifact not found at {model_path}.")
        print("Please run setup_model.py first.")
        sys.exit(1)
        
    print(f"Model path resolved: {model_path}")
    
    # 2. Check GPU/CUDA availability
    cuda_available = torch.cuda.is_available()
    print(f"CUDA available: {cuda_available}")
    
    device_name = "cpu"
    if cuda_available:
        device_name = torch.cuda.get_device_name(0)
        print(f"Device name: {device_name}")
        # Log VRAM before load
        vram_allocated = torch.cuda.memory_allocated(0) / (1024 ** 2)
        print(f"VRAM allocated (Before load): {vram_allocated:.2f} MB")
    else:
        print("Environment Limitation: CUDA not available. Falling back to CPU.")
        
    # 3. Load YOLO-World-S
    print("Loading model...")
    try:
        model = YOLOWorld(str(model_path))
    except Exception as e:
        print(f"FAIL: Failed to load model. {e}")
        sys.exit(1)
        
    if cuda_available:
        vram_allocated = torch.cuda.memory_allocated(0) / (1024 ** 2)
        print(f"VRAM allocated (After load): {vram_allocated:.2f} MB")
        
    # 4. Generate trivial local test image
    test_image_path = script_dir / "smoke_test_image.jpg"
    try:
        img = Image.new('RGB', (320, 320), color='grey')
        img.save(test_image_path)
    except Exception as e:
        print(f"FAIL: Could not generate test image. {e}")
        sys.exit(1)
        
    # 5. Run inference smoke test
    print("Running inference...")
    try:
        # Set classes to a generic test case to avoid broad search overhead
        model.set_classes(["wheelchair ramp", "grab bars"])
        results = model(str(test_image_path), verbose=False)
        print("Inference completed successfully.")
        
        # Verify result without exposing confidence scores
        if len(results) > 0:
            print(f"Detected {len(results[0].boxes)} candidate bounding boxes.")
            print("Note: Detections are candidate evidence only and must not be used as accessibility scores.")
            
    except Exception as e:
        print(f"FAIL: Inference failed. {e}")
        sys.exit(1)
    finally:
        # Cleanup
        if test_image_path.exists():
            test_image_path.unlink()
            
    if cuda_available:
        vram_allocated = torch.cuda.memory_allocated(0) / (1024 ** 2)
        vram_reserved = torch.cuda.memory_reserved(0) / (1024 ** 2)
        print(f"VRAM allocated (After inference): {vram_allocated:.2f} MB")
        print(f"VRAM reserved (After inference): {vram_reserved:.2f} MB")
        
        if vram_allocated > 7000:
            print("WARNING: VRAM allocated is close to the 8GB constraint limit.")
        else:
            print("VRAM usage is comfortably within the RTX 5050 8GB constraint.")
            
    print("Status: PASS")

if __name__ == "__main__":
    run_smoke_test()
