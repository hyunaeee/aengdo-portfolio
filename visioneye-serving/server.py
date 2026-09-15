"""Loopback-only, single-worker YOLO model server. No CUDA or tracking state.

The supervisor owns its child process and creates a fresh Pipe after every
failure: messages from a timed-out worker cannot satisfy the next request.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import io
import json
import multiprocessing as mp
import os
from pathlib import Path
import socket
import threading
import time
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODEL_SHA256 = "9b09cc8bf347f0fc8a5f7657480587f25db09b34bf33b0652110fb03a8ad4fef"
MAX_BODY = 1_500_000
MAX_PIXELS = 3_000_000


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def decode_payload(raw):
    try:
        obj = json.loads(raw)
        if not isinstance(obj, dict) or set(obj) != {"image_base64"}:
            raise ValueError()
        image = base64.b64decode(obj["image_base64"], validate=True)
        if not image or len(image) > 1_000_000:
            raise ValueError()
        return image
    except (ValueError, TypeError, KeyError):
        raise ValueError("Expected one image_base64 field containing an image under 1 MB") from None


def model_worker(conn, model_path, runtime_dir):
    # Set before importing the numeric libraries. No shared environment changes.
    os.environ.update(CUDA_VISIBLE_DEVICES="", OMP_NUM_THREADS="2",
                      MKL_NUM_THREADS="2", YOLO_CONFIG_DIR=runtime_dir,
                      YOLO_AUTOINSTALL="false")
    try:
        if digest(model_path) != MODEL_SHA256:
            raise ValueError("Model SHA256 mismatch")
        import cv2
        import numpy as np
        import torch
        from PIL import Image
        from ultralytics import YOLO, settings
        import ultralytics
        torch.set_num_threads(2)
        torch.set_num_interop_threads(1)
        cv2.setNumThreads(1)
        settings.update({"sync": False})
        model = YOLO(model_path, task="detect")
        if model.names.get(0) != "person":
            raise ValueError("Expected COCO person class")
        opts = dict(classes=[0], conf=0.1, imgsz=640, rect=False,
                    device="cpu", quantize=32, verbose=False, save=False)
        model.predict(np.zeros((640, 640, 3), dtype=np.uint8), **opts)
        # Ultralytics changes the CPU thread count while creating its backend.
        # Apply the experiment's limit after that initialization as well.
        torch.set_num_threads(2)
        conn.send({"type": "ready", "model_sha256": MODEL_SHA256,
                   "device": str(next(model.model.parameters()).device),
                   "torch": torch.__version__, "ultralytics": ultralytics.__version__,
                   "opencv": cv2.__version__, "threads": torch.get_num_threads()})
        while True:
            message = conn.recv()
            if message["fault"] == "crash":
                os._exit(73)  # Rehearsal-only real child-process exit.
            if message["fault"] == "stall":
                time.sleep(60)  # Supervisor must terminate this worker on deadline.
            try:
                with Image.open(io.BytesIO(message["image"])) as probe:
                    if probe.format not in {"JPEG", "PNG"} or probe.width * probe.height > MAX_PIXELS:
                        raise ValueError("Invalid image size or type")
                    probe.verify()
                frame = cv2.imdecode(np.frombuffer(message["image"], np.uint8), cv2.IMREAD_COLOR)
                if frame is None:
                    raise ValueError("Image cannot be decoded")
            except Exception:
                conn.send({"type": "bad_image"})
                continue
            started = time.perf_counter()
            result = model.predict(frame, **opts)[0]
            detections = [{"xyxy": b, "confidence": c, "class_id": 0}
                          for b, c in zip(result.boxes.xyxy.cpu().tolist(),
                                          result.boxes.conf.cpu().tolist())]
            conn.send({"type": "result", "request_id": message["request_id"],
                       "detections": detections, "width": frame.shape[1],
                       "height": frame.shape[0], "inference_ms": round((time.perf_counter()-started)*1000, 3),
                       "torch_threads": torch.get_num_threads(),
                       "image_sha256": hashlib.sha256(message["image"]).hexdigest()})
    except EOFError:
        pass
    except Exception as exc:
        try:
            conn.send({"type": "fatal", "error_type": type(exc).__name__})
        except (OSError, EOFError):
            pass
    finally:
        conn.close()


class Supervisor:
    def __init__(self, model, runtime, event_file, deadline=5.0, worker_target=model_worker):
        if digest(model) != MODEL_SHA256:
            raise ValueError("Model SHA256 mismatch; server not started")
        self.model, self.runtime = str(Path(model).resolve()), str(Path(runtime).resolve())
        Path(self.runtime).mkdir(parents=True, exist_ok=True)
        self.event_file = Path(event_file)
        self.event_file.parent.mkdir(parents=True, exist_ok=True)
        self.deadline, self.worker_target = deadline, worker_target
        self.ctx = mp.get_context("spawn")
        self.lock = threading.RLock()
        self.log_lock = threading.Lock()
        self.slot = threading.BoundedSemaphore(1)
        self.stop = threading.Event()
        self.state, self.generation, self.restarts = "starting", 0, 0
        self.process, self.pipe, self.info = None, None, {}
        self.counts, self.completed, self.duration_sum = Counter(), 0, 0.0
        self.request_serial = 0
        self.failures_without_ready = 0
        self.boot_started = time.monotonic()
        self.spawn()
        self.monitor = threading.Thread(target=self.watch, daemon=True)
        self.monitor.start()

    def event(self, kind, **data):
        row = {"event": kind, "time_unix": time.time(), "generation": self.generation, **data}
        with self.log_lock, self.event_file.open("a", encoding="utf-8") as out:
            out.write(json.dumps(row, ensure_ascii=False) + "\n")

    def spawn(self):
        self.generation += 1
        self.state = "starting"
        self.info = {}
        self.boot_started = time.monotonic()
        self.pipe, child = self.ctx.Pipe()
        self.process = self.ctx.Process(target=self.worker_target,
                                       args=(child, self.model, self.runtime), daemon=True)
        self.process.start()
        child.close()
        self.event("worker_start", worker_pid=self.process.pid)

    def dispose(self):
        if self.process is not None:
            if self.process.is_alive():
                self.process.terminate()
            self.process.join(3)
            if self.process.is_alive():
                self.process.kill()
                self.process.join(3)
            if self.process.is_alive():
                raise RuntimeError("Owned worker could not be stopped")
            self.process.close()
        if self.pipe is not None:
            self.pipe.close()
        self.process, self.pipe = None, None

    def recover(self, reason):
        self.state = "restarting"
        self.event("worker_failure", reason=reason)
        self.dispose()
        self.restarts += 1
        self.failures_without_ready += 1
        if self.failures_without_ready >= 3:
            self.state = "failed"
            self.event("restart_budget_exhausted")
        else:
            self.spawn()

    def watch(self):
        while not self.stop.wait(0.02):
            with self.lock:
                if self.state in {"busy", "failed", "stopping"}:
                    continue  # The request thread exclusively owns response reads.
                if self.process is None or not self.process.is_alive():
                    self.recover("unexpected_exit")
                    continue
                if self.state == "starting":
                    try:
                        if self.pipe.poll():
                            result = self.pipe.recv()
                            if result.get("type") != "ready" or result.get("device") != "cpu" or result.get("model_sha256") != MODEL_SHA256:
                                self.recover("invalid_startup")
                                continue
                            self.info = result
                            self.state = "ready"
                            self.failures_without_ready = 0
                            self.event("worker_ready", startup_ms=round((time.monotonic()-self.boot_started)*1000, 3), **result)
                        elif time.monotonic() - self.boot_started > 45:
                            self.recover("startup_timeout")
                    except (EOFError, OSError):
                        self.recover("startup_exit")

    def health(self):
        with self.lock:
            alive = self.process is not None and self.process.is_alive()
            return {"ready": alive and self.state in {"ready", "busy"},
                    "state": self.state, "generation": self.generation,
                    "inflight": int(self.state == "busy"), "restarts": self.restarts,
                    "model": "YOLO26n", "model_sha256": MODEL_SHA256,
                    "device": "cpu", "worker_pid": self.process.pid if alive else None,
                    "runtime": self.info}

    def infer(self, data, fault=None):
        if not self.slot.acquire(blocking=False):
            return 429, {"error": "capacity_exceeded", "retry_after_seconds": 1}
        try:
            with self.lock:
                if self.state != "ready" or not self.process.is_alive():
                    return 503, {"error": "model_not_ready"}
                self.state = "busy"
                self.request_serial += 1
                request_id = self.request_serial
                generation = self.generation
            try:
                self.pipe.send({"image": data, "fault": fault, "request_id": request_id})
                if not self.pipe.poll(self.deadline):
                    with self.lock:
                        self.recover("request_deadline")
                    return 504, {"error": "request_deadline", "generation": generation}
                result = self.pipe.recv()
                if result.get("type") == "bad_image":
                    return 400, {"error": "invalid_image"}
                if result.get("type") != "result" or result.get("request_id") != request_id:
                    raise EOFError()
                return 200, {**result, "generation": generation, "model_sha256": MODEL_SHA256, "device": "cpu"}
            except (EOFError, OSError):
                with self.lock:
                    self.recover("worker_exit_during_request")
                return 503, {"error": "worker_exited", "generation": generation}
        finally:
            with self.lock:
                if self.state == "busy":
                    self.state = "ready"
            self.slot.release()

    def record_request(self, status, elapsed, **data):
        with self.lock:
            self.counts[status] += 1
            self.completed += 1
            self.duration_sum += elapsed
        self.event("request", status=status, elapsed_ms=round(elapsed*1000, 3), **data)

    def metrics(self):
        with self.lock:
            lines = [f'visioneye_requests_total{{status="{k}"}} {v}' for k, v in sorted(self.counts.items())]
            lines += [f"visioneye_inflight {int(self.state == 'busy')}",
                      f"visioneye_worker_restarts_total {self.restarts}",
                      f"visioneye_request_duration_seconds_sum {self.duration_sum}",
                      f"visioneye_request_duration_seconds_count {self.completed}"]
            return "\n".join(lines) + "\n"

    def close(self):
        self.stop.set()
        self.monitor.join(2)
        # Caller drains HTTP request threads before disposing the worker.
        with self.lock:
            self.state = "stopping"
            self.dispose()
            self.event("server_stopped")


class Server(ThreadingHTTPServer):
    # Drain requests on server_close; no orphaned inference after shutdown.
    daemon_threads = False
    allow_reuse_address = True

    def __init__(self, *args, **kwargs):
        self.connections = threading.BoundedSemaphore(16)
        super().__init__(*args, **kwargs)

    def process_request(self, request, address):
        if not self.connections.acquire(blocking=False):
            self.shutdown_request(request)
            return
        try:
            super().process_request(request, address)
        except Exception:
            self.connections.release()
            raise

    def process_request_thread(self, request, address):
        try:
            super().process_request_thread(request, address)
        finally:
            self.connections.release()


def make_server(model, runtime, event_file, token, port=0, deadline=5.0, allow_test_faults=False,
                worker_target=model_worker):
    if len(token) < 24:
        raise ValueError("A random token of at least 24 characters is required")
    supervisor = Supervisor(model, runtime, event_file, deadline, worker_target)

    class Handler(BaseHTTPRequestHandler):
        server_version = "VisionEyeLab/1"

        def setup(self):
            super().setup()
            self.connection.settimeout(3)

        def log_message(self, *args):
            pass

        def reply(self, status, payload, text=False):
            body = payload.encode() if text else json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "text/plain; version=0.0.4" if text else "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Connection", "close")
            if status == 429:
                self.send_header("Retry-After", "1")
            self.end_headers()
            self.close_connection = True
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                supervisor.event("client_disconnected")

        def valid_host(self):
            return self.headers.get("Host", "") in {f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"}

        def do_GET(self):
            if not self.valid_host():
                return self.reply(403, {"error": "invalid_host"})
            if self.path == "/health/live":
                return self.reply(200, {"live": True})
            if self.path == "/health/ready":
                state = supervisor.health()
                return self.reply(200 if state["ready"] else 503, state)
            if self.path == "/metrics":
                return self.reply(200, supervisor.metrics(), text=True)
            self.reply(404, {"error": "not_found"})

        def do_POST(self):
            started = time.perf_counter()
            if not self.valid_host() or self.headers.get("Origin"):
                return self.reply(403, {"error": "origin_not_allowed"})
            if not hmac.compare_digest(self.headers.get("Authorization", ""), "Bearer " + token):
                return self.reply(401, {"error": "unauthorized"})
            faults = {"/__test/crash": "crash", "/__test/stall": "stall"}
            if self.path != "/predict" and not (allow_test_faults and self.path in faults):
                return self.reply(404, {"error": "not_found"})
            status, result = 400, {"error": "invalid_request"}
            try:
                if self.headers.get("Transfer-Encoding") or self.headers.get("Content-Type") != "application/json":
                    raise ValueError()
                length = int(self.headers.get("Content-Length", "0"))
                if length > MAX_BODY:
                    status, result = 413, {"error": "body_too_large"}
                elif length <= 0:
                    raise ValueError()
                else:
                    raw = self.rfile.read(length)
                    if len(raw) != length:
                        raise ValueError()
                    data = decode_payload(raw)
                    status, result = supervisor.infer(data, faults.get(self.path))
            except (ValueError, socket.timeout, ConnectionError):
                pass
            supervisor.record_request(status, time.perf_counter()-started,
                                      route=self.path, image_sha256=result.get("image_sha256"),
                                      detection_count=len(result.get("detections", [])))
            self.reply(status, result)

    try:
        httpd = Server(("127.0.0.1", port), Handler)
    except Exception:
        supervisor.close()
        raise
    httpd.supervisor = supervisor
    return httpd


def close_server(httpd):
    httpd.shutdown()
    httpd.server_close()
    httpd.supervisor.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--port", type=int, default=18861)
    parser.add_argument("--runtime", default=".runtime")
    parser.add_argument("--events", default="artifacts/server-events.jsonl")
    parser.add_argument("--deadline", type=float, default=5)
    args = parser.parse_args()
    if not 0.1 <= args.deadline <= 30:
        parser.error("deadline must be between 0.1 and 30 seconds")
    httpd = make_server(args.model, args.runtime, args.events,
                       os.environ.get("VISIONEYE_API_TOKEN", ""), args.port, args.deadline)
    print(f"VisionEye model server: http://127.0.0.1:{httpd.server_port} (CPU; test endpoints disabled)", flush=True)
    try:
        httpd.serve_forever(poll_interval=0.1)
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        httpd.supervisor.close()


if __name__ == "__main__":
    mp.freeze_support()
    main()
