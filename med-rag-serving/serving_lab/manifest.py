import re
from pathlib import Path
from .common import digest_file, digest_object, read_json, runtime_digest


def compose_values(manifest):
    return {"VLLM_IMAGE": manifest["images"]["vllm"], "PYTHON_IMAGE": manifest["images"]["python"], "PROMETHEUS_IMAGE": manifest["images"]["prometheus"], "MODEL_ID": manifest["model"]["id"], "MODEL_REVISION": manifest["model"]["revision"], "TOKENIZER_REVISION": manifest["model"]["tokenizer_revision"], "SERVED_MODEL": manifest["model"]["served_name"], "MODEL_DTYPE": manifest["model"]["dtype"], "MAX_MODEL_LEN": str(manifest["serving"]["max_model_len"]), "MAX_NUM_SEQS": str(manifest["serving"]["max_num_seqs"]), "GPU_MEMORY_UTILIZATION": str(manifest["serving"]["gpu_memory_utilization"])}


def validate_runtime_environment(manifest, root, environment, max_inflight):
    # Compose feeds these exact same variables to the engine command/image and gateway.
    for key, expected in compose_values(manifest).items():
        if environment.get(key) != expected:
            raise ValueError("Runtime environment does not match manifest: " + key)
    if max_inflight != manifest["serving"]["max_num_seqs"]:
        raise ValueError("Gateway admission bound does not match locked engine concurrency")
    frozen = Path(root) / manifest["runtime"]["path"] / "serving_lab"
    running = Path(__file__).resolve().parent
    def hashes(directory):
        return {path.name: digest_file(path) for path in directory.glob("*.py")}
    if hashes(running) != hashes(frozen):
        raise ValueError("Running gateway code differs from the frozen runtime")


def validate_manifest(manifest, root, allow_simulated=False):
    errors = []
    if manifest.get("schema_version") != 1:
        errors.append("schema_version must be 1")
    fixture = manifest.get("test_fixture", False)
    if fixture and not allow_simulated:
        errors.append("CPU test fixture cannot authorize live inference or deployment")
    model = manifest.get("model", {})
    for key in ("revision", "tokenizer_revision"):
        value = model.get(key, "")
        if not re.fullmatch(r"[0-9a-f]{40}", value) or len(set(value)) == 1:
            errors.append(f"model.{key} must be an immutable, non-placeholder 40-hex commit")
    if not re.fullmatch(r"[A-Za-z0-9._/-]+", model.get("id", "")):
        errors.append("model.id is invalid")
    if not re.fullmatch(r"[A-Za-z0-9._-]+", model.get("served_name", "")):
        errors.append("model.served_name is invalid")
    for component in ("vllm", "python", "prometheus"):
        image = manifest.get("images", {}).get(component, "")
        if not re.fullmatch(r"[A-Za-z0-9._/:+-]+@sha256:[0-9a-f]{64}", image):
            errors.append(f"{component} image must be pinned by registry digest")
        elif len(set(image.rsplit(":", 1)[-1])) == 1:
            errors.append(f"{component} digest is a placeholder")
    for key in ("prompt", "dataset"):
        item = manifest.get(key, {})
        path = (Path(root) / item.get("path", "")).resolve()
        base = Path(root).resolve()
        if base not in path.parents or not path.is_file():
            errors.append(f"{key}.path must identify a file inside the experiment directory")
        elif digest_file(path) != item.get("sha256"):
            errors.append(f"{key} content hash mismatch")
    if manifest.get("dataset", {}).get("kind") != "synthetic":
        errors.append("This public lab accepts only synthetic datasets")
    runtime = manifest.get("runtime", {})
    runtime_path = (Path(root) / runtime.get("path", "")).resolve()
    if Path(root).resolve() not in runtime_path.parents or not runtime_path.is_dir():
        errors.append("runtime.path must identify the frozen runtime directory")
    elif runtime_digest(runtime_path) != runtime.get("sha256"):
        errors.append("Frozen runtime content hash mismatch")
    serving = manifest.get("serving", {})
    if not isinstance(serving.get("max_model_len"), int) or serving.get("max_model_len", 0) < 512:
        errors.append("serving.max_model_len must be >= 512")
    if model.get("dtype") not in ("bfloat16", "float16", "float32"):
        errors.append("dtype must explicitly identify the measured precision")
    memory = serving.get("gpu_memory_utilization", 0)
    if not isinstance(memory, (int, float)) or not 0 < memory <= 0.95:
        errors.append("gpu_memory_utilization must be in (0, 0.95]")
    if not isinstance(serving.get("max_num_seqs"), int) or serving.get("max_num_seqs", 0) < 1:
        errors.append("max_num_seqs must be positive")
    acceptance = manifest.get("acceptance", {})
    for key in ("max_error_rate", "max_overrefusal_rate", "min_goodput_ratio"):
        value = acceptance.get(key)
        if not isinstance(value, (int, float)) or not 0 <= value <= 1:
            errors.append(f"acceptance.{key} must be between 0 and 1")
    if not isinstance(acceptance.get("min_completed_requests"), int) or acceptance.get("min_completed_requests", 0) < 20:
        errors.append("min_completed_requests must be >=20; final experiments should use larger samples")
    return errors


def load_manifest(path, allow_simulated=False):
    path = Path(path).resolve()
    value = read_json(path)
    errors = validate_manifest(value, path.parent, allow_simulated)
    if errors:
        raise ValueError("; ".join(errors))
    return value, path.parent, digest_object(value)
