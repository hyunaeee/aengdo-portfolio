"""Replayable evidence from real loopback HTTP and explicitly synthetic quality controls.

Starts two temporary CPU servers on OS-assigned ports. No models, Docker, GPU,
external endpoints or existing services are accessed. Never promotes a live release.
"""
import concurrent.futures
import json
import os
import platform
import threading
import time
from contextlib import contextmanager
from http.client import HTTPConnection
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from .client import stream_request
from .common import digest_bytes, digest_object, read_json, read_jsonl, utc_now, write_json
from .fixtures import cpu_demo
from .gateway import create_server
from .manifest import compose_values, load_manifest
from .release import prepare


@contextmanager
def running(server):
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.02}, daemon=True)
    thread.start()
    try:
        yield "http://127.0.0.1:" + str(server.server_port)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def rehearsal(output):
    output = Path(output).resolve()
    if output.exists():
        raise ValueError("Rehearsal requires a new output directory")
    output.mkdir(parents=True)
    control_dir = output / "controls"
    control = cpu_demo(control_dir)
    manifest, _, fingerprint = load_manifest(control_dir / "manifest.json", True)
    model = manifest["model"]["served_name"]
    payload = {"model": model, "messages": [{"role": "user", "content": "Synthetic protocol probe"}], "stream": True, "max_tokens": 8}
    state = {"mode": "normal"}
    entered, release = threading.Event(), threading.Event()

    class Upstream(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def send_body(self, status, body, kind="application/json"):
            self.send_response(status)
            self.send_header("Content-Type", kind)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path == "/health":
                self.send_body(503 if state["mode"] == "unavailable" else 200, b'{}')
            elif self.path == "/v1/models":
                self.send_body(200, json.dumps({"data": [{"id": model}]}).encode())
            else:
                self.send_body(404, b'{}')

        def do_POST(self):
            self.rfile.read(int(self.headers["Content-Length"]))
            mode = state["mode"]
            if mode == "hold":
                entered.set()
                if not release.wait(4):
                    return
            if mode == "unavailable":
                self.send_body(503, b'{"error":"injected_unavailable"}')
                return
            # Deliberately stop before headers to exercise the gateway deadline.
            if mode == "timeout":
                release.wait(2)
                return
            chunks = [
                {"model": model, "choices": [{"index": 0, "delta": {"content": "Synthetic "}}]},
                {"model": model, "choices": [{"index": 0, "delta": {"content": "reply."}, "finish_reason": "stop"}]},
                {"model": model, "choices": [], "usage": {"completion_tokens": 2, "prompt_tokens": 4}},
            ]
            body = "".join("data: " + json.dumps(c) + "\n\n" for c in chunks)
            if mode != "truncated":
                body += "data: [DONE]\n\n"
            self.send_body(200, body.encode(), "text/event-stream")

    upstream = ThreadingHTTPServer(("127.0.0.1", 0), Upstream)
    upstream.daemon_threads = True
    events = []
    started = time.perf_counter()

    def record(event_id, result, expected, stage="gateway"):
        # Do not publish transport ports, local paths, prompts or machine identity.
        event = {"id": event_id, "stage": stage, "at_ms": round((time.perf_counter() - started) * 1000, 2), **result, "expected": expected}
        event["passed"] = all(event.get(key) == value for key, value in expected.items())
        events.append(event)
        if not event["passed"]:
            raise AssertionError("Rehearsal contract failed: " + event_id)

    with running(upstream) as upstream_url:
        # Preserve the live start path's complete manifest/environment validation.
        values = compose_values(manifest)
        previous = {key: os.environ.get(key) for key in values}
        os.environ.update(values)
        try:
            gateway = create_server(control_dir / "manifest.json", upstream_url, port=0, max_inflight=4, deadline_s=1, allow_simulated=True)
        finally:
            for key, value in previous.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value
        with running(gateway) as url:
            def get(path):
                conn = HTTPConnection("127.0.0.1", gateway.server_port, timeout=4)
                try:
                    conn.request("GET", path)
                    response = conn.getresponse()
                    return response.status, response.read().decode()
                finally:
                    conn.close()

            def stream(event_id, expected):
                result = stream_request(url, payload, timeout=4)
                record(event_id, {"http_status": result["http_status"], "ok": result["ok"], "error": result["error"], "identity_matches": result["server_manifest_sha256"] == fingerprint}, expected)
                return result

            status, body = get("/ready")
            record("ready", {"http_status": status, "identity_matches": json.loads(body).get("manifest_sha256") == fingerprint}, {"http_status": 200, "identity_matches": True})
            stream("normal", {"http_status": 200, "ok": True, "identity_matches": True})
            # Fill all four slots; synchronize on server entry, not arbitrary sleeps.
            state["mode"] = "hold"
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
                held = [pool.submit(stream_request, url, payload, 4) for _ in range(4)]
                try:
                    if not entered.wait(2):
                        raise AssertionError("Upstream never received held requests")
                    cutoff = time.monotonic() + 0.7
                    while True:
                        _, metrics = get("/metrics")
                        if "serving_lab_inflight 4\n" in metrics:
                            break
                        if time.monotonic() > cutoff:
                            raise AssertionError("Gateway slots did not fill")
                        time.sleep(0.005)
                    stream("capacity", {"http_status": 429, "ok": False, "error": "http_429"})
                finally:
                    release.set()
                recovered_slots = all(f.result(timeout=4)["ok"] for f in held)
                record("slots-released", {"ok": recovered_slots, "requests": 4}, {"ok": True})
            state["mode"] = "unavailable"
            status, _ = get("/ready")
            record("not-ready", {"http_status": status}, {"http_status": 503})
            stream("upstream-error", {"http_status": 503, "ok": False, "error": "http_503"})
            state["mode"] = "truncated"
            stream("truncated", {"http_status": 200, "ok": False, "error": "missing_done"})
            release.clear()
            state["mode"] = "timeout"
            try:
                stream("deadline", {"http_status": 504, "ok": False, "error": "http_504"})
            finally:
                release.set()
            state["mode"] = "normal"
            status, _ = get("/ready")
            record("ready-again", {"http_status": status}, {"http_status": 200})
            stream("recovered", {"http_status": 200, "ok": True, "identity_matches": True})
            # Wait for the last handler's finally block before reading counters.
            cutoff = time.monotonic() + 1
            while True:
                status, metrics = get("/metrics")
                if "serving_lab_inflight 0\n" in metrics:
                    break
                if time.monotonic() > cutoff:
                    raise AssertionError("Leaked gateway admission slot")
                time.sleep(0.005)
            counts = {line.split()[0].removeprefix("serving_lab_"): int(line.split()[1]) for line in metrics.splitlines() if line and not line.startswith("#")}
            record("metrics", counts, {"requests_total": 10, "completed_total": 6, "rejected_total": 1, "upstream_errors_total": 3, "inflight": 0}, "observe")

    good = read_json(control_dir / "good.gate.json")
    bad = read_json(control_dir / "bad.gate.json")
    record("good-gate", {"status": good["status"], "failed_cases": good["failed_cases"]}, {"status": "pass", "failed_cases": 0}, "quality")
    record("bad-gate", {"status": bad["status"], "failed_cases": bad["failed_cases"], "release_created": (control_dir / "bad-releases").exists()}, {"status": "blocked", "failed_cases": 2, "release_created": False}, "quality")
    # Tamper only with this new run's disposable fixture, then call the real release gate.
    benchmark = read_json(control_dir / "benchmark.json")
    original = dict(benchmark)
    benchmark["goodput_ratio"] = 0.42
    write_json(control_dir / "benchmark.json", benchmark)
    try:
        prepare(control_dir / "manifest.json", control_dir / "good.responses.jsonl", control_dir / "benchmark.raw.jsonl", control_dir / "benchmark.json", control_dir / "tampered-releases", True)
        raise AssertionError("Edited summary authorized a release")
    except ValueError as exc:
        if "does not match raw" not in str(exc):
            raise
        record("tamper", {"status": "blocked", "release_created": (control_dir / "tampered-releases").exists()}, {"status": "blocked", "release_created": False}, "release")
    finally:
        write_json(control_dir / "benchmark.json", original)

    cases = read_jsonl(control_dir / "eval/cases.jsonl")
    bad_responses = {r["id"]: r["answer"] for r in read_jsonl(control_dir / "bad.responses.jsonl")}
    source = Path(__file__).resolve().parents[1]
    report = {
        "schema_version": 1, "recorded_at": utc_now(), "run_id": "cpu-" + digest_object(events)[:12],
        "evidence_kind": "loopback-http-and-synthetic-controls", "python": platform.python_version(), "os": platform.system(),
        "scope": {"real_http": True, "upstream": "scripted CPU fixture", "gpu_executed": False, "external_network": False, "live_deployment": False, "timings": "event ordering only; not model latency or recovery benchmarks"},
        "manifest_sha256": fingerprint, "runtime_sha256": manifest["runtime"]["sha256"],
        "source_hash_format": "sha256-utf8-lf",
        "source_sha256": {name: digest_bytes((source / name).read_bytes().replace(b"\r\n", b"\n")) for name in ["serving_lab/rehearsal.py", "serving_lab/gateway.py", "serving_lab/quality.py", "serving_lab/release.py", "serving_lab/manifest.py", "serving_lab/client.py"]},
        "events": events, "contracts_passed": sum(e["passed"] for e in events), "metrics": counts,
        "quality": {"good": good, "bad": bad, "cases": [{"id": c["id"], "question": c["question"], "context": c["context"], "answerable": c["answerable"], "reference": c["reference_answer"], "candidate": bad_responses[c["id"]]} for c in cases]},
        "release": {"good": "prepared-not-deployed", "bad": control["bad_candidate_release"], "tampered": "blocked"},
    }
    write_json(output / "evidence.json", report)
    (output / "gateway.prom").write_text(metrics, encoding="utf-8")
    return report
