import os
import sys
import shutil
from pathlib import Path

try:
    from ultralytics import YOLOWorld
except ImportError:
    print("Please install ultralytics first.")
    sys.exit(1)

def setup_model():
    print("=== YOLO-World-S Setup ===")
    
    script_dir = Path(__file__).resolve().parent
    model_dir = script_dir / "model"
    model_path = model_dir / "yolo-world-s.pt"
    
    model_dir.mkdir(parents=True, exist_ok=True)
    
    if model_path.exists():
        # Check size to verify it wasn't a botched download
        if model_path.stat().st_size > 20_000_000:
            print(f"Model already exists at: {model_path}")
            print("Skipping download.")
            return 0
        else:
            print(f"Existing model file seems too small ({model_path.stat().st_size} bytes). Re-downloading.")
            model_path.unlink()
        
    print("Downloading YOLO-World-S via Ultralytics...")
    try:
        model = YOLOWorld("yolov8s-worldv2.pt")
        # Ultralytics typically downloads to the current working directory
        cwd_pt = Path.cwd() / "yolov8s-worldv2.pt"
        if cwd_pt.exists():
            shutil.move(str(cwd_pt), str(model_path))
            print(f"Moved model to {model_path}")
        else:
            print(f"Saving loaded model to {model_path}")
            # If for some reason it's cached elsewhere, PyTorch can re-save it
            import torch
            torch.save(model.ckpt, str(model_path))
            
        print("Setup complete.")
        return 0
    except Exception as e:
        print(f"Failed to setup model: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(setup_model())
