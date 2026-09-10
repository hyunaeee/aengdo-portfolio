import hashlib
import json
import os
import tempfile
import shutil
from datetime import datetime, timezone
from pathlib import Path


def runtime_digest(root):
    root = Path(root)
    return digest_object({path.relative_to(root).as_posix(): digest_file(path) for path in sorted(root.rglob("*")) if path.is_file() and "__pycache__" not in path.parts and path.suffix != ".pyc"})


def snapshot_runtime(source, target):
    source, target = Path(source), Path(target)
    for name in ("serving_lab", "observability"):
        shutil.copytree(source / name, target / name, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    for name in ("Dockerfile", ".dockerignore", "compose.yaml"):
        shutil.copyfile(source / name, target / name)
    return runtime_digest(target)


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def digest_bytes(data):
    return hashlib.sha256(data).hexdigest()


def digest_file(path):
    return digest_bytes(Path(path).read_bytes())


def digest_object(value):
    return digest_bytes(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode())


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def read_jsonl(path):
    return [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines() if line.strip()]


def write_json(path, value):
    """Replace one local artifact atomically; never expose a partially written release."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=target.parent, delete=False) as handle:
        tmp = Path(handle.name)
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    try:
        os.replace(tmp, target)
    finally:
        tmp.unlink(missing_ok=True)


def write_jsonl(path, rows):
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")


def safe_path(root, relative):
    root = Path(root).resolve()
    result = (root / relative).resolve()
    if result == root or root not in result.parents:
        raise ValueError("Artifact path must stay within the experiment directory")
    return result
