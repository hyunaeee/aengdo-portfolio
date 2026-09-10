"""Offline release preparation. Never starts, stops or replaces a GPU process."""
import shutil
import re
from pathlib import Path
from .benchmark import summarize
from .common import digest_object, read_json, read_jsonl, safe_path, utc_now, write_json
from .manifest import compose_values, load_manifest
from .quality import evaluate


def export_env(manifest_path, output, gpu_device_uuid):
    manifest, root, _ = load_manifest(manifest_path)
    if not re.fullmatch(r"GPU-[0-9a-fA-F-]{16,}", gpu_device_uuid):
        raise ValueError("Select an explicit confirmed idle GPU UUID, never an inferred device index")
    target = Path(output)
    if target.exists():
        raise ValueError("Environment output already exists")
    values = {**compose_values(manifest), "RELEASE_DIR": root.as_posix(), "GPU_DEVICE_UUID": gpu_device_uuid, "LAB_PORT": "18080"}
    if any("\n" in str(value) or "\r" in str(value) for value in values.values()):
        raise ValueError("Environment values cannot contain line breaks")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(f"{key}={value}" for key, value in values.items()) + "\n", encoding="utf-8")
    return target


def verify_evidence(manifest_path, responses_path, raw_path, benchmark_path, allow_simulated=False):
    manifest, root, fingerprint = load_manifest(manifest_path, allow_simulated)
    kind = "simulated-cpu" if manifest.get("test_fixture") else "live-endpoint"
    cases = read_jsonl(safe_path(root, manifest["dataset"]["path"]))
    responses = read_jsonl(responses_path)
    if kind == "live-endpoint" and any(row.get("server_manifest_sha256") != fingerprint for row in responses):
        raise ValueError("Evaluation was not captured through the matching lab gateway")
    gate = evaluate(cases, responses, fingerprint, manifest["acceptance"], kind)
    if gate["status"] != "pass":
        raise ValueError("Release blocked by quality gate")
    raw, recorded = read_jsonl(raw_path), read_json(benchmark_path)
    if any(row.get("evidence_kind") != kind for row in raw):
        raise ValueError("Benchmark evidence kind mismatch")
    if kind == "live-endpoint" and any(row["ok"] and row.get("server_manifest_sha256") != fingerprint for row in raw):
        raise ValueError("Successful benchmark rows lack matching gateway identity")
    if recorded.get("evidence_kind") != kind or recorded.get("manifest_sha256") != fingerprint:
        raise ValueError("Benchmark report provenance mismatch")
    report = summarize(raw, recorded["wall_time_s"], fingerprint, manifest["slo"], kind)
    # Recompute from raw records: an edited pass flag or summary cannot authorize release.
    for key in ("raw_sha256", "requests", "completed", "failed", "error_rate", "latency_ms", "goodput_ratio", "output_tokens_per_second", "slo"):
        if recorded.get(key) != report[key]:
            raise ValueError(f"Benchmark report does not match raw evidence: {key}")
    if recorded.get("workload_sha256") != digest_object(cases):
        raise ValueError("Benchmark workload is not the locked synthetic dataset")
    slo = manifest["slo"]
    if slo.get("calibrated") is not True or not slo.get("rationale", "").strip():
        raise ValueError("Release requires frozen, calibrated SLO thresholds with rationale")
    acceptance = manifest["acceptance"]
    if report["completed"] < acceptance["min_completed_requests"]:
        raise ValueError("Release blocked: insufficient successful benchmark requests")
    if report["error_rate"] > acceptance["max_error_rate"]:
        raise ValueError("Release blocked: error budget exceeded")
    if report["goodput_ratio"] is None or report["goodput_ratio"] < acceptance["min_goodput_ratio"]:
        raise ValueError("Release blocked: missing token usage or SLO goodput below gate")
    return manifest, root, fingerprint, gate, report


def prepare(manifest_path, responses_path, raw_path, benchmark_path, output_root, allow_simulated=False):
    manifest, root, fingerprint, gate, report = verify_evidence(manifest_path, responses_path, raw_path, benchmark_path, allow_simulated)
    target = Path(output_root).resolve() / fingerprint
    if target.exists():
        raise ValueError("Release directory already exists; immutable artifacts are never overwritten")
    target.mkdir(parents=True)
    try:
        for item in (manifest["prompt"], manifest["dataset"]):
            destination = safe_path(target, item["path"])
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(safe_path(root, item["path"]), destination)
        shutil.copytree(safe_path(root, manifest["runtime"]["path"]), safe_path(target, manifest["runtime"]["path"]))
        write_json(target / "manifest.json", manifest)
        for source, name in ((responses_path, "responses.jsonl"), (raw_path, "benchmark.raw.jsonl"), (benchmark_path, "benchmark.json")):
            shutil.copyfile(source, target / name)
        write_json(target / "quality-gate.json", gate)
        write_json(target / "release.json", {"schema_version": 1, "created_at": utc_now(), "manifest_sha256": fingerprint, "evidence_kind": report["evidence_kind"], "status": "prepared-not-deployed", "gpu_validation": "operator must attach actual hardware/runtime evidence before deployment", "test_fixture": bool(manifest.get("test_fixture"))})
        if not manifest.get("test_fixture"):
            values = {**compose_values(manifest), "RELEASE_DIR": target.as_posix(), "GPU_DEVICE_UUID": "SET_EXPLICIT_IDLE_DEVICE_UUID", "LAB_PORT": "18080"}
            (target / "release.env").write_text("\n".join(f"{key}={value}" for key, value in values.items()) + "\n", encoding="utf-8")
        return target
    except BaseException:
        # Only remove the newly created, precisely resolved release directory.
        shutil.rmtree(target)
        raise


def record_deployment(release_dir, state_path, readiness):
    release_dir = Path(release_dir).resolve()
    manifest, _, fingerprint = load_manifest(release_dir / "manifest.json")
    # Re-run both gates before recording; the readiness response must identify this manifest.
    verify_evidence(release_dir / "manifest.json", release_dir / "responses.jsonl", release_dir / "benchmark.raw.jsonl", release_dir / "benchmark.json")
    if readiness.get("status") != "ready" or readiness.get("manifest_sha256") != fingerprint or readiness.get("model") != manifest["model"]["served_name"]:
        raise ValueError("Readiness does not match candidate manifest and served model")
    state_path = Path(state_path)
    old = read_json(state_path) if state_path.exists() else {}
    current = {"manifest_sha256": fingerprint, "release_dir": str(release_dir), "recorded_at": utc_now()}
    if old.get("current", {}).get("manifest_sha256") == fingerprint:
        return old
    state = {"schema_version": 1, "current": current, "previous": old.get("current"), "note": "Operator deployment record; does not perform or prove a zero-downtime rollout."}
    write_json(state_path, state)
    return state


def rollback_plan(state_path):
    state = read_json(state_path)
    previous = state.get("previous")
    if not previous:
        raise ValueError("No previous verified release is recorded")
    path = Path(previous["release_dir"])
    _, _, fingerprint = load_manifest(path / "manifest.json")
    if fingerprint != previous["manifest_sha256"]:
        raise ValueError("Previous release changed after recording")
    verify_evidence(path / "manifest.json", path / "responses.jsonl", path / "benchmark.raw.jsonl", path / "benchmark.json")
    return {"status": "manual-rollback-required", "previous_manifest_sha256": fingerprint, "release_dir": str(path), "env_file": str(path / "release.env"), "steps": ["Stop new requests to the isolated lab gateway and record the incident start.", "Use this previous release.env with the same isolated Compose project; verify the GPU UUID before replacement.", "Wait for /ready, send one explicit synthetic warmup, verify the model and manifest identity.", "Record the deployed release again and measure the actual unavailable interval."], "limitations": "Single GPU replacement can have downtime. This command never changes running services."}
