"""Run actual model inference over HTTP, then crash/stall the owned worker.

This harness never connects to an existing endpoint. It binds an ephemeral
loopback port, creates its own worker, and closes both before returning.
"""
import argparse
import base64
import concurrent.futures
import hashlib
import json
import math
import multiprocessing as mp
from pathlib import Path
import platform
import secrets
import threading
import time
import urllib.error
import urllib.request

from server import MODEL_SHA256, MAX_BODY, close_server, digest, make_server


def run(model, fixtures, out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=False)
    fixture_paths = sorted(Path(fixtures).glob("*.jpg"))
    if len(fixture_paths) < 3:
        raise ValueError("At least 3 public, generated-video JPEG frames required")
    images = [p.read_bytes() for p in fixture_paths]
    token = secrets.token_urlsafe(32)
    rows, checks, phases = [], [], []
    started = time.perf_counter()
    httpd = make_server(model, out / "runtime", out / "events.jsonl", token,
                       deadline=2.0, allow_test_faults=True)
    thread = threading.Thread(target=httpd.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True)
    thread.start()
    port = httpd.server_port
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    def request(path, payload=None, auth=True, label=None):
        headers = {"Content-Type": "application/json"}
        if auth:
            headers["Authorization"] = "Bearer " + token
        data = None if payload is None else (payload if isinstance(payload, bytes) else json.dumps(payload).encode())
        req = urllib.request.Request(f"http://127.0.0.1:{port}" + path, data=data, headers=headers)
        begin = time.perf_counter()
        try:
            response = opener.open(req, timeout=12)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            status = response.status
            body = response.read().decode()
            try:
                body = json.loads(body)
            except ValueError:
                pass
        row = {"label": label or path, "path": path, "status": status,
               "elapsed_ms": round((time.perf_counter()-begin)*1000, 3),
               "offset_ms": round((begin-started)*1000, 3), "response": body}
        if label:
            rows.append(row)
        return row

    def check(name, ok, detail=None):
        checks.append({"name": name, "passed": bool(ok), "detail": detail})
        if not ok:
            raise AssertionError(name + ": " + str(detail))

    def wait_ready(label):
        begin = time.perf_counter()
        samples = []
        while time.perf_counter()-begin < 50:
            row = request("/health/ready")
            state = row["response"]
            if not samples or samples[-1]["state"] != state["state"]:
                samples.append({"at_ms": round((time.perf_counter()-begin)*1000, 3), "state": state["state"], "status": row["status"]})
            if row["status"] == 200 and state["ready"]:
                phase = {"name": label, "wait_ms": round((time.perf_counter()-begin)*1000, 3), "samples": samples,
                         "generation": state["generation"], "runtime": state["runtime"]}
                phases.append(phase)
                return phase
            time.sleep(0.05)
        raise TimeoutError("Worker not ready")

    payload = lambda i: {"image_base64": base64.b64encode(images[i % len(images)]).decode()}
    try:
        boot = wait_ready("startup")
        check("cpu_device", boot["runtime"]["device"] == "cpu")
        check("cpu_thread_limit", boot["runtime"]["threads"] == 2)
        check("model_pin", boot["runtime"]["model_sha256"] == MODEL_SHA256)
        check("liveness", request("/health/live", label="liveness")["status"] == 200)
        check("authentication", request("/predict", payload(0), auth=False, label="unauthorized")["status"] == 401)
        check("malformed_json", request("/predict", b"{", label="invalid_json")["status"] == 400)
        check("invalid_image", request("/predict", {"image_base64": base64.b64encode(b"not an image").decode()}, label="invalid_image")["status"] == 400)
        check("request_size_bound", request("/predict", b"x"*(MAX_BODY+1), label="oversized")["status"] == 413)

        nominal = []
        for i in range(20):
            row = request("/predict", payload(i), label=f"inference_{i+1:02d}")
            check(f"inference_{i+1:02d}", row["status"] == 200 and len(row["response"].get("detections", [])) > 0)
            check(f"input_hash_{i+1:02d}", row["response"]["image_sha256"] == hashlib.sha256(images[i % len(images)]).hexdigest())
            check(f"threads_{i+1:02d}", row["response"]["torch_threads"] == 2)
            nominal.append(row)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            # An artificial stall makes saturation deterministic; not a load benchmark.
            stalled = pool.submit(request, "/__test/stall", payload(0), True, "deadline")
            deadline = time.monotonic()+5
            while request("/health/ready")["response"]["inflight"] != 1:
                if time.monotonic() > deadline:
                    raise TimeoutError("No inflight request")
                time.sleep(0.01)
            busy = request("/predict", payload(1), label="capacity")
            check("bounded_admission", busy["status"] == 429)
            row = stalled.result()
            check("deadline_504", row["status"] == 504)
        check("not_ready_during_reload", request("/health/ready", label="reload_readiness")["status"] == 503)
        check("reject_during_reload", request("/predict", payload(0), label="reload_reject")["status"] == 503)
        recovered = wait_ready("after_deadline")
        check("new_worker_after_deadline", recovered["generation"] > boot["generation"])
        result = request("/predict", payload(1), label="after_deadline_inference")
        check("inference_after_deadline", result["status"] == 200 and len(result["response"].get("detections", [])) > 0)
        check("no_stale_response", result["response"]["image_sha256"] == hashlib.sha256(images[1]).hexdigest())

        crash_start = time.perf_counter()
        crash = request("/__test/crash", payload(0), label="worker_crash")
        check("crash_503", crash["status"] == 503)
        check("crash_liveness", request("/health/live", label="live_during_crash")["status"] == 200)
        phase = wait_ready("after_crash")
        result = request("/predict", payload(2), label="after_crash_inference")
        phase["fault_request_to_success_ms"] = round((time.perf_counter()-crash_start)*1000, 3)
        check("new_worker_after_crash", phase["generation"] > recovered["generation"])
        check("inference_after_crash", result["status"] == 200 and len(result["response"].get("detections", [])) > 0)
        state = request("/health/ready", label="final_readiness")["response"]
        check("inflight_cleared", state["inflight"] == 0 and state["ready"])
        check("restart_count", state["restarts"] == 2)
        metrics = request("/metrics", label="metrics")["response"]
        check("metrics_expose_failures", 'status="504"' in metrics and 'status="429"' in metrics and "visioneye_worker_restarts_total 2" in metrics)
        (out / "metrics.prom").write_text(metrics, encoding="utf-8")
        latencies = sorted(row["elapsed_ms"] for row in nominal)
        summary = {"schema_version": 1, "mode": "actual_model_cpu_loopback", "status": "passed",
                   "recorded_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                   "model": {"name": "YOLO26n", "sha256": MODEL_SHA256, "device": "cpu", "imgsz": 640,
                             "rect": False, "precision": "FP32", "confidence": 0.1, "classes": [0]},
                   "runtime": {"python": platform.python_version(), "os": platform.system(),
                               "machine": platform.machine(), **boot["runtime"]},
                   "fixtures": [{"file": p.name, "sha256": digest(p)} for p in fixture_paths],
                   "baseline": {"requests": 20, "successes": len(nominal), "concurrency": 1,
                                "p50_ms": round((latencies[9]+latencies[10])/2, 3),
                                "p95_ms": latencies[math.ceil(len(latencies)*0.95)-1],
                                "min_ms": latencies[0], "max_ms": latencies[-1]},
                   "phases": phases, "checks": checks, "worker_restarts": state["restarts"],
                   "scope": ["Local CPU model-server rehearsal, not deployed production traffic.",
                             "20 sequential requests over 3 AI-generated video frames; no accuracy benchmark.",
                             "Startup includes model load and warmup; baseline HTTP latency excludes startup.",
                             "429 verified during injected worker stall; not a capacity or throughput benchmark.",
                             "Actual child-process exit and deadline termination; same pinned model reloaded.",
                             "No GPU, CCTV, tracking-session service, LLM serving, long soak, autoscaling, or model-version rollback test.",
                             "Public website displays recorded evidence and does not accept inference requests."]}
    finally:
        close_server(httpd)
        thread.join(2)
        with (out / "requests.jsonl").open("w", encoding="utf-8") as file:
            for row in sorted(rows, key=lambda r: r["offset_ms"]):
                file.write(json.dumps(row, ensure_ascii=False) + "\n")
    check("owned_worker_stopped", httpd.supervisor.process is None)
    summary["checks"] = checks
    # Local source hashes let the public checker detect stale reports after edits.
    summary["source_hashes"] = {p: digest(Path(__file__).parent / p) for p in ["server.py", "rehearsal.py"]}
    (out / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps({"status": summary["status"], "checks": len(checks), "baseline": summary["baseline"], "phases": phases}, indent=2))


if __name__ == "__main__":
    mp.freeze_support()
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--fixtures", default="fixtures")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    run(args.model, args.fixtures, args.out)
