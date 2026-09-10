"""Small OpenAI-compatible HTTP/SSE client with an overall request deadline."""
import http.client
import json
import socket
import time
from urllib.parse import urlsplit


def endpoint(value, allow_remote=False):
    parsed = urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("Endpoint must be an HTTP(S) origin without credentials, query, or fragment")
    if parsed.path not in ("", "/"):
        raise ValueError("Pass an origin, not an API path")
    if not allow_remote and parsed.hostname not in ("127.0.0.1", "localhost", "::1"):
        raise ValueError("Remote endpoint requires --allow-remote; prefer an isolated localhost/SSH tunnel")
    return parsed


def connection(parsed, timeout):
    cls = http.client.HTTPSConnection if parsed.scheme == "https" else http.client.HTTPConnection
    return cls(parsed.hostname, parsed.port, timeout=timeout)


def sse_events(lines):
    """Join multi-line SSE data, skip comments/heartbeats, reject unframed truncation."""
    parts = []
    size = 0
    for line in lines:
        if len(line) > 1_048_576:
            raise ValueError("SSE line exceeds limit")
        line = line.rstrip(b"\r\n")
        if not line:
            if parts:
                yield b"\n".join(parts).decode("utf-8")
                parts, size = [], 0
            continue
        if line.startswith(b"data:"):
            value = line[5:]
            if value.startswith(b" "):
                value = value[1:]
            parts.append(value)
            size += len(value)
            if size > 2_097_152:
                raise ValueError("SSE event exceeds limit")
    if parts:
        raise ValueError("Truncated SSE event")


def stream_request(origin, payload, timeout=60.0, allow_remote=False, token=None, request_id=None):
    parsed = endpoint(origin, allow_remote)
    conn = connection(parsed, timeout)
    start = time.perf_counter()
    first = last = None
    answer, output_tokens, prompt_tokens, done = "", None, None, False
    model, finish_reason, http_status, error = None, None, None, None
    content_events = 0
    server_manifest = None
    headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if request_id:
        headers["X-Request-ID"] = request_id
    try:
        conn.request("POST", "/v1/chat/completions", json.dumps(payload).encode(), headers)
        transport = conn.sock
        remaining = timeout - (time.perf_counter() - start)
        if remaining <= 0:
            raise TimeoutError("overall_deadline")
        if transport:
            transport.settimeout(remaining)
        response = conn.getresponse()
        http_status = response.status
        server_manifest = response.getheader("X-Serving-Manifest")
        if response.status != 200:
            # Do not persist server bodies, which may contain prompts or credentials.
            raise ValueError(f"http_{response.status}")
        if "text/event-stream" not in response.getheader("Content-Type", ""):
            raise ValueError("not_sse")

        def lines():
            consumed = 0
            while True:
                remaining = timeout - (time.perf_counter() - start)
                if remaining <= 0:
                    raise TimeoutError("overall_deadline")
                if transport:
                    transport.settimeout(remaining)
                line = response.readline(1_048_577)
                if not line:
                    return
                consumed += len(line)
                if consumed > 16_777_216:
                    raise ValueError("response_size_limit")
                yield line

        for event in sse_events(lines()):
            if event == "[DONE]":
                done = True
                break
            data = json.loads(event)
            if not isinstance(data, dict):
                raise ValueError("invalid_stream")
            if data.get("error"):
                raise ValueError("stream_error")
            model = data.get("model", model)
            usage = data.get("usage")
            if usage:
                if not isinstance(usage, dict):
                    raise ValueError("invalid_usage")
                output_tokens = usage.get("completion_tokens")
                prompt_tokens = usage.get("prompt_tokens")
                for value in (output_tokens, prompt_tokens):
                    if value is not None and (type(value) is not int or value < 0):
                        raise ValueError("invalid_usage")
            for choice in data.get("choices", []):
                if not isinstance(choice, dict):
                    raise ValueError("invalid_stream")
                if choice.get("index", 0) != 0:
                    continue
                finish_reason = choice.get("finish_reason") or finish_reason
                delta_obj = choice.get("delta") or {}
                if not isinstance(delta_obj, dict):
                    raise ValueError("invalid_stream")
                delta = delta_obj.get("content")
                if isinstance(delta, str) and delta:
                    now = time.perf_counter()
                    first = now if first is None else first
                    last = now
                    answer += delta
                    content_events += 1
        if not done:
            raise ValueError("missing_done")
        if first is None:
            raise ValueError("empty_generation")
        if model != payload["model"]:
            raise ValueError("served_model_mismatch")
    except (TimeoutError, socket.timeout):
        error = "timeout"
    except (OSError, http.client.HTTPException) as exc:
        error = type(exc).__name__
    except (ValueError, TypeError, KeyError) as exc:
        error = str(exc) if str(exc) in {"not_sse", "stream_error", "invalid_usage", "response_size_limit", "missing_done", "empty_generation", "served_model_mismatch"} or str(exc).startswith("http_") else "invalid_stream"
    finally:
        conn.close()
    end = time.perf_counter()
    return {
        "ok": error is None, "error": error, "http_status": http_status,
        "answer": answer, "served_model": model, "finish_reason": finish_reason,
        "server_manifest_sha256": server_manifest,
        "prompt_tokens": prompt_tokens, "output_tokens": output_tokens,
        "ttft_ms": (first - start) * 1000 if first is not None else None,
        "tpot_ms": (last - first) * 1000 / (output_tokens - 1) if first is not None and output_tokens and output_tokens > 1 else None,
        "e2e_ms": (end - start) * 1000,
        "content_span_ms": (last - first) * 1000 if first is not None else None,
        "content_events": content_events,
        "timing_scope": "client dispatch to SSE arrival; TPOT uses final server token usage, never chunk count",
    }


def get_json(origin, path, timeout=5, allow_remote=False, token=None):
    conn = connection(endpoint(origin, allow_remote), timeout)
    try:
        conn.request("GET", path, headers={"Authorization": "Bearer " + token} if token else {})
        response = conn.getresponse()
        body = response.read(1_048_577)
        if response.status != 200 or len(body) > 1_048_576:
            raise ValueError(f"health_http_{response.status}")
        return json.loads(body)
    finally:
        conn.close()
