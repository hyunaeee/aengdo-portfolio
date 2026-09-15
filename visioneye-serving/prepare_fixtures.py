"""Extract three reproducible frames from VisionEye's public AI-generated clip."""
import argparse
import hashlib
import json
from pathlib import Path

SOURCE_SHA256 = "9f79a902723ac40ae1e74db9a649a04e33651c5599b5f04c32dc5f7d3441afc5"


def prepare(source, output):
    import cv2
    cv2.setNumThreads(1)
    source = Path(source)
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError("Source differs from the published generated clip")
    out = Path(output)
    out.mkdir(parents=True, exist_ok=False)
    video = cv2.VideoCapture(str(source))
    manifest = {"source_url": "https://github.com/hyunaeee/visioneye-lab/raw/refs/heads/main/web/assets/crowd-source.mp4",
                "source_sha256": SOURCE_SHA256, "source_kind": "Higgsfield AI-generated video",
                "opencv": cv2.__version__, "jpeg_quality": 90, "frames": []}
    try:
        for frame_index in (48, 144, 240):
            video.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = video.read()
            if not ok:
                raise ValueError("Frame missing")
            filename = f"crowd-{frame_index:03d}.jpg"
            ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            if not ok:
                raise ValueError("JPEG encoding failed")
            content = encoded.tobytes()
            (out/filename).write_bytes(content)
            manifest["frames"].append({"file": filename, "frame_index": frame_index,
                                       "sha256": hashlib.sha256(content).hexdigest(),
                                       "width": frame.shape[1], "height": frame.shape[0]})
    finally:
        video.release()
    (out/"source.json").write_text(json.dumps(manifest, indent=2)+"\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--out", default="fixtures")
    args = parser.parse_args()
    prepare(args.source, args.out)
