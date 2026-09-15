"""Fetch the pinned official weight asset; refuse changed or existing files."""
import hashlib
from pathlib import Path
import urllib.request
from server import MODEL_SHA256

URL = "https://github.com/ultralytics/assets/releases/download/v8.4.0/yolo26n.pt"


if __name__ == "__main__":
    path = Path("models/yolo26n.pt")
    path.parent.mkdir(exist_ok=True)
    with urllib.request.urlopen(URL, timeout=60) as response:
        data = response.read(10_000_001)
    if len(data) > 10_000_000 or hashlib.sha256(data).hexdigest() != MODEL_SHA256:
        raise ValueError("Model size or SHA256 mismatch; nothing written")
    with path.open("xb") as out:
        out.write(data)
    print("Verified", path.name, MODEL_SHA256)
