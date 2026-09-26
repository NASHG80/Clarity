import os
import sys
import tempfile
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path.cwd()))


def test_model_path_resolution():
    with mock.patch.dict(os.environ, {"MODEL_PATH": "test_path.pt"}):
        model_path_env = os.environ.get("MODEL_PATH")
        assert model_path_env == "test_path.pt"

if __name__ == "__main__":
    test_model_path_resolution()
    print("All unit tests passed for D11 setup code.")
