"""Recompute public claims from the recorded requests and lifecycle events."""
from collections import Counter
import json
import math
from pathlib import Path

from server import digest, MODEL_SHA256


def verify(directory):
    root = Path(__file__).resolve().parent
    directory = Path(directory)
    summary = json.loads((directory/"summary.json").read_text(encoding="utf-8"))
    requests = [json.loads(line) for line in (directory/"requests.jsonl").read_text(encoding="utf-8").splitlines()]
    events = [json.loads(line) for line in (directory/"events.jsonl").read_text(encoding="utf-8").splitlines()]
    assert summary["mode"] == "actual_model_cpu_loopback" and summary["status"] == "passed"
    assert all(check["passed"] for check in summary["checks"])
    for filename, expected in summary["source_hashes"].items():
        assert digest(root/filename) == expected, f"Stale evidence for {filename}"
    assert summary["model"]["sha256"] == MODEL_SHA256
    assert summary["runtime"]["device"] == "cpu" and summary["runtime"]["threads"] == 2
    fixture_hashes = {item["sha256"] for item in summary["fixtures"]}
    for item in summary["fixtures"]:
        assert digest(root/"fixtures"/item["file"]) == item["sha256"]
    labeled = {row["label"]: row for row in requests}
    assert len(labeled) == len(requests)
    baseline = [row for row in requests if row["label"].startswith("inference_")]
    assert len(baseline) == 20 and all(row["status"] == 200 for row in baseline)
    for row in baseline:
        response = row["response"]
        assert response["model_sha256"] == MODEL_SHA256 and response["device"] == "cpu"
        assert response["image_sha256"] in fixture_hashes and response["torch_threads"] == 2
        assert len(response["detections"]) > 0
        assert all(d["class_id"] == 0 and len(d["xyxy"]) == 4 and 0.1 <= d["confidence"] <= 1 for d in response["detections"])
    times = sorted(row["elapsed_ms"] for row in baseline)
    assert summary["baseline"] == {"requests": 20, "successes": 20, "concurrency": 1,
                                   "p50_ms": round((times[9]+times[10])/2, 3),
                                   "p95_ms": times[math.ceil(len(times)*.95)-1],
                                   "min_ms": times[0], "max_ms": times[-1]}
    statuses = {"unauthorized": 401, "invalid_json": 400, "invalid_image": 400, "oversized": 413,
                "capacity": 429, "deadline": 504, "reload_readiness": 503, "reload_reject": 503,
                "after_deadline_inference": 200, "worker_crash": 503, "live_during_crash": 200,
                "after_crash_inference": 200, "final_readiness": 200}
    for label, status in statuses.items():
        assert labeled[label]["status"] == status, label
    assert labeled["after_deadline_inference"]["response"]["generation"] == 2
    assert labeled["after_crash_inference"]["response"]["generation"] == 3
    assert labeled["after_deadline_inference"]["response"]["image_sha256"] == summary["fixtures"][1]["sha256"]
    assert labeled["after_crash_inference"]["response"]["image_sha256"] == summary["fixtures"][2]["sha256"]
    assert labeled["final_readiness"]["response"]["inflight"] == 0
    assert summary["worker_restarts"] == 2
    assert [e["generation"] for e in events if e["event"] == "worker_ready"] == [1, 2, 3]
    assert [e["reason"] for e in events if e["event"] == "worker_failure"] == ["request_deadline", "worker_exit_during_request"]
    assert events[-1]["event"] == "server_stopped"
    counts = Counter(e["status"] for e in events if e["event"] == "request")
    metrics = (directory/"metrics.prom").read_text(encoding="utf-8")
    assert all(f'visioneye_requests_total{{status="{k}"}} {v}' in metrics for k, v in counts.items())
    assert "visioneye_inflight 0\n" in metrics
    print(f"Model-server evidence verified: {len(baseline)} real-inference records, 2 worker recoveries, source/fixture hashes and metrics agree.")


if __name__ == "__main__":
    import sys
    verify(sys.argv[1] if len(sys.argv)>1 else Path(__file__).resolve().parent/"reports"/"validated")
