"""Deliberate CPU-only controls. Values are invented to exercise code, not measured."""
import copy
import shutil
from pathlib import Path
from .benchmark import summarize
from .common import digest_file, digest_object, read_json, read_jsonl, snapshot_runtime, write_json, write_jsonl
from .quality import evaluate
from .release import prepare


def cpu_demo(output):
    source = Path(__file__).resolve().parents[1]
    output = Path(output).resolve()
    if output.exists():
        raise ValueError("CPU demo requires a new output directory to preserve evidence")
    output.mkdir(parents=True)
    shutil.copytree(source / "eval", output / "eval")
    manifest = read_json(source / "manifest.template.json")
    manifest["test_fixture"] = True
    manifest["experiment"] = "SIMULATED-CPU-NOT-A-GPU-RUN"
    revision = digest_object("fictional-test-commit")[:40]
    manifest["model"].update(revision=revision, tokenizer_revision=revision)
    for name in ("vllm", "python", "prometheus"):
        manifest["images"][name] = "fixture.invalid/" + name + "@sha256:" + digest_object("fictional-" + name)
    for key in ("prompt", "dataset"):
        manifest[key]["sha256"] = digest_file(output / manifest[key]["path"])
    manifest["runtime"]["sha256"] = snapshot_runtime(source, output / "runtime")
    manifest["slo"] = {"ttft_ms": 10, "tpot_ms": 10, "e2e_ms": 100, "calibrated": True, "rationale": "Fictional CPU fixture thresholds, never a GPU SLO."}
    manifest["acceptance"]["min_completed_requests"] = 20
    write_json(output / "manifest.json", manifest)
    fingerprint = digest_object(manifest)
    cases = read_jsonl(output / "eval/cases.jsonl")
    good = [{"id": case["id"], "answer": case["reference_answer"], "manifest_sha256": fingerprint, "evidence_kind": "simulated-cpu"} for case in cases]
    bad = copy.deepcopy(good)
    bad[0]["answer"] = '09:00부터 17:00까지입니다. [invented.md]'
    bad[1]["answer"] = '자료로는 답할 수 없습니다.'
    for name, responses in (("good", good), ("bad", bad)):
        write_jsonl(output / f"{name}.responses.jsonl", responses)
        write_json(output / f"{name}.gate.json", evaluate(cases, responses, fingerprint, manifest["acceptance"], "simulated-cpu"))
    rows = [{"index": i, "request_id": f"simulated-{i}", "ok": True, "error": None, "ttft_ms": 1.0, "tpot_ms": 2.0, "e2e_ms": 5.0, "output_tokens": 3, "prompt_tokens": 10, "manifest_sha256": fingerprint, "evidence_kind": "simulated-cpu"} for i in range(20)]
    report = summarize(rows, 1.0, fingerprint, manifest["slo"], "simulated-cpu")
    report.update(workload_sha256=digest_object(cases), scope="Invented CPU test data. Not endpoint, model, or GPU measurements.")
    write_jsonl(output / "benchmark.raw.jsonl", rows)
    write_json(output / "benchmark.json", report)
    blocked = False
    try:
        prepare(output / "manifest.json", output / "bad.responses.jsonl", output / "benchmark.raw.jsonl", output / "benchmark.json", output / "bad-releases", allow_simulated=True)
    except ValueError as exc:
        if "quality gate" not in str(exc):
            raise
        blocked = True
    if not blocked or (output / "bad-releases").exists():
        raise AssertionError("Bad candidate was not blocked before release creation")
    prepared = prepare(output / "manifest.json", output / "good.responses.jsonl", output / "benchmark.raw.jsonl", output / "benchmark.json", output / "simulated-releases", allow_simulated=True)
    result = {"evidence_kind": "simulated-cpu", "gpu_executed": False, "network_called": False, "good_quality_gate": "pass", "bad_candidate_release": "blocked", "simulated_release_dir": str(prepared), "warning": "No measured performance or model quality can be inferred from these controls."}
    write_json(output / "demo-result.json", result)
    return result
