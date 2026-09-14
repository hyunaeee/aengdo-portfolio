"""Local-lab bounded SSE proxy; not a public, multi-tenant authentication service."""
import http.client
import json
import math
import os
import socket
import threading
import time
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from .client import connection, endpoint, get_json
from .manifest import load_manifest, validate_runtime_environment


def bounded_payload(payload, model):
    allowed = {"model", "messages", "stream", "max_tokens", "temperature", "stream_options", "n"}
    if not isinstance(payload, dict) or set(payload) - allowed:
        raise ValueError("Unsupported request fields")
    max_tokens = payload.get("max_tokens")
    if payload.get("model") != model or payload.get("stream") is not True or type(max_tokens) is not int or not 1 <= max_tokens <= 512:
        raise ValueError("Invalid bounded stream request")
    if type(payload.get("n", 1)) is not int or payload.get("n", 1) != 1:
        raise ValueError("Only one generation per request is allowed")
    temperature = payload.get("temperature", 0)
    if type(temperature) not in (int, float) or not math.isfinite(temperature) or not 0 <= temperature <= 2:
        raise ValueError("Invalid temperature")
    messages = payload.get("messages")
    if not isinstance(messages, list) or not messages:
        raise ValueError("Missing messages")
    if any(not isinstance(item, dict) or item.get("role") not in ("system", "user", "assistant") or not isinstance(item.get("content"), str) for item in messages):
        raise ValueError("Unsupported message")
    return {"model": model, "messages": [{"role": item["role"], "content": item["content"]} for item in messages], "stream": True, "max_tokens": max_tokens, "temperature": temperature, "n": 1, "stream_options": {"include_usage": True}}


def ready(upstream, model, fingerprint, token=None):
    conn = connection(endpoint(upstream, True), 5)
    try:
        conn.request("GET", "/health")
        response = conn.getresponse()
        response.read(1024)
        if response.status != 200:
            raise ValueError("Engine health failed")
    finally:
        conn.close()
    models = get_json(upstream, "/v1/models", allow_remote=True, token=token)
    if model not in [item.get("id") for item in models.get("data", [])]:
        raise ValueError("Engine served model does not match manifest")
    return {"status": "ready", "model": model, "manifest_sha256": fingerprint, "scope": "Gateway manifest identity plus upstream health/model check; not weight attestation or a generation warmup."}


def create_server(manifest_path, upstream="http://engine:8000", host="127.0.0.1", port=8080, max_inflight=4, deadline_s=120, *, allow_simulated=False):
    """Construct a stoppable gateway; fixture mode is restricted to loopback on both sides."""
    if allow_simulated:
        if host != "127.0.0.1":
            raise ValueError("Fixture gateway must bind to 127.0.0.1")
        endpoint(upstream)  # Reject non-loopback origins before opening a socket.
    manifest, root, fingerprint = load_manifest(manifest_path, allow_simulated)
    validate_runtime_environment(manifest, root, os.environ, max_inflight)
    if not 1 <= max_inflight <= 64 or not 0 < deadline_s <= 600:
        raise ValueError("Invalid gateway bounds")
    model = manifest["model"]["served_name"]
    token = os.environ.get("UPSTREAM_API_KEY")
    slots = threading.BoundedSemaphore(max_inflight)
    counters = Counter()
    lock = threading.Lock()

    def count(key, amount=1):
        with lock:
            counters[key] += amount

    class Handler(BaseHTTPRequestHandler):
        server_version = "MEDRAGLab/0.1"

        def setup(self):
            super().setup()
            self.connection.settimeout(deadline_s)

        def log_message(self, *_):
            pass  # Do not log prompts, tokens, headers or generated text.

        def send_json(self, status, data):
            body = json.dumps(data).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("X-Serving-Manifest", fingerprint)
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path == "/health":
                self.send_json(200, {"status": "alive", "manifest_sha256": fingerprint})
            elif self.path == "/ready":
                try:
                    self.send_json(200, ready(upstream, model, fingerprint, token))
                except (ValueError, OSError, http.client.HTTPException):
                    self.send_json(503, {"status": "not-ready", "manifest_sha256": fingerprint})
            elif self.path == "/metrics":
                with lock:
                    values = dict(counters)
                names = ("requests_total", "rejected_total", "completed_total", "upstream_errors_total", "disconnects_total", "inflight")
                text = "".join(f"# TYPE serving_lab_{name} {'gauge' if name == 'inflight' else 'counter'}\nserving_lab_{name} {values.get(name, 0)}\n" for name in names)
                body = text.encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/plain; version=0.0.4")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                self.send_json(404, {"error": "not_found"})

        def do_POST(self):
            if self.path != "/v1/chat/completions":
                self.send_json(404, {"error": "not_found"})
                return
            if self.headers.get("Transfer-Encoding"):
                self.send_json(400, {"error": "content_length_required"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 65536:
                    raise ValueError()
                payload = bounded_payload(json.loads(self.rfile.read(length)), model)
            except (ValueError, TypeError, OSError):
                self.send_json(400, {"error": "invalid_bounded_stream_request"})
                return
            count("requests_total")
            if not slots.acquire(blocking=False):
                count("rejected_total")
                self.send_json(429, {"error": "lab_capacity_exceeded"})
                return
            count("inflight")
            conn = connection(endpoint(upstream, True), deadline_s)
            started = False
            cutoff = time.monotonic() + deadline_s
            try:
                headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}
                if token:
                    headers["Authorization"] = "Bearer " + token
                payload["stream_options"] = {"include_usage": True}
                conn.request("POST", "/v1/chat/completions", json.dumps(payload).encode(), headers)
                transport = conn.sock
                response = conn.getresponse()
                if response.status != 200:
                    count("upstream_errors_total")
                    self.send_json(response.status if response.status in (400, 429, 503) else 502, {"error": "upstream_rejected"})
                    return
                if "text/event-stream" not in response.getheader("Content-Type", ""):
                    raise ValueError("Upstream did not stream SSE")
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self.send_header("Connection", "close")
                self.send_header("X-Serving-Manifest", fingerprint)
                self.end_headers()
                started = True
                total = 0
                done = False
                while True:
                    remaining = cutoff - time.monotonic()
                    if remaining <= 0:
                        raise TimeoutError()
                    if transport:
                        transport.settimeout(remaining)
                    chunk = response.readline(1048577)
                    if not chunk:
                        break
                    total += len(chunk)
                    if len(chunk) > 1048576 or total > 16777216:
                        raise ValueError("Stream size exceeded")
                    self.wfile.write(chunk)
                    self.wfile.flush()
                    if chunk.strip() == b"data: [DONE]":
                        # Emit the final frame delimiter before closing.
                        self.wfile.write(b"\n")
                        self.wfile.flush()
                        done = True
                        break
                count("completed_total" if done else "upstream_errors_total")
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                count("disconnects_total")
            except (OSError, ValueError, http.client.HTTPException):
                count("upstream_errors_total")
                if not started:
                    self.send_json(504, {"error": "upstream_unavailable"})
                # Once SSE started, close it without DONE; clients must record failure.
            finally:
                conn.close()  # Cancellation closes upstream; engine reclamation must be measured.
                self.close_connection = True
                count("inflight", -1)
                slots.release()

    server = ThreadingHTTPServer((host, port), Handler)
    server.daemon_threads = True
    return server


def serve(manifest_path, upstream="http://engine:8000", host="127.0.0.1", port=8080, max_inflight=4, deadline_s=120):
    server = create_server(manifest_path, upstream, host, port, max_inflight, deadline_s)
    try:
        server.serve_forever()
    finally:
        server.server_close()
