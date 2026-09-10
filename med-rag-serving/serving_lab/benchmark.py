import concurrent.futures
import math
import threading
import time
import uuid
from collections import Counter
from .client import stream_request
from .common import digest_object, utc_now


def payload_for(case, prompt, model, max_tokens):
    evidence = "\n\n".join(f"[{item['source_id']}]\n{item['text']}" for item in case["context"])
    return {"model": model, "messages": [{"role": "system", "content": prompt}, {"role": "user", "content": evidence + "\n\n질문: " + case["question"]}], "temperature": 0, "max_tokens": max_tokens, "stream": True, "stream_options": {"include_usage": True}}


def percentile(values, quantile):
    if not values:
        return None
    values = sorted(values)
    index = (len(values) - 1) * quantile
    lo, hi = math.floor(index), math.ceil(index)
    return values[lo] + (values[hi] - values[lo]) * (index - lo)


def distribution(values):
    values = [value for value in values if value is not None]
    return {"n": len(values), "p50": percentile(values, .5), "p95": percentile(values, .95) if len(values) >= 20 else None, "max": max(values) if values else None}


def summarize(rows, duration_s, manifest_sha, slo, evidence_kind="live-endpoint"):
    if not isinstance(duration_s, (int, float)) or not math.isfinite(duration_s) or duration_s <= 0 or not rows:
        raise ValueError("A measured benchmark requires requests and a positive wall-clock duration")
    if evidence_kind not in ("live-endpoint", "simulated-cpu"):
        raise ValueError("Unknown benchmark evidence kind")
    ids = [row.get("request_id") for row in rows]
    if any(not item for item in ids) or len(ids) != len(set(ids)):
        raise ValueError("Raw benchmark request IDs must be present and unique")
    for row in rows:
        if type(row.get("ok")) is not bool or row.get("evidence_kind") != evidence_kind:
            raise ValueError("Invalid benchmark status or evidence kind")
        for key in ("ttft_ms", "tpot_ms", "e2e_ms", "prompt_tokens", "output_tokens"):
            value = row.get(key)
            if value is not None and (type(value) not in (int, float) or not math.isfinite(value) or value < 0):
                raise ValueError("Invalid raw measurement: " + key)
    good = [row for row in rows if row["ok"]]
    if any(row.get("manifest_sha256") != manifest_sha for row in rows):
        raise ValueError("Mixed manifest provenance in benchmark")
    limits = {key: slo.get(key) for key in ("ttft_ms", "tpot_ms", "e2e_ms")}
    evaluable = all(type(v) in (int, float) and math.isfinite(v) and v > 0 for v in limits.values())
    compliant = [row for row in good if evaluable and all(row.get(key) is not None and row[key] <= value for key, value in limits.items())]
    tokens_known = bool(good) and all(row.get("output_tokens") is not None for row in good)
    return {
        "schema_version": 1, "kind": "serving-benchmark", "created_at": utc_now(),
        "evidence_kind": evidence_kind, "manifest_sha256": manifest_sha,
        "raw_sha256": digest_object(rows), "requests": len(rows), "completed": len(good),
        "failed": len(rows) - len(good), "error_rate": (len(rows) - len(good)) / len(rows),
        "error_counts": dict(Counter(row.get("error") or "unspecified" for row in rows if not row["ok"])),
        "wall_time_s": duration_s, "requests_per_second": len(good) / duration_s,
        "output_tokens_per_second": sum(row["output_tokens"] for row in good) / duration_s if tokens_known else None,
        "latency_ms": {key: distribution([row.get(key) for row in good]) for key in limits},
        "token_lengths": {key: distribution([row.get(key) for row in good]) for key in ("prompt_tokens", "output_tokens")},
        "slo": slo, "slo_compliant_requests": len(compliant) if evaluable else None,
        "goodput_requests_per_second": len(compliant) / duration_s if evaluable else None,
        "goodput_ratio": len(compliant) / len(rows) if evaluable else None,
        "gpu_measurements": None,
        "cost": None,
        "scope": "Real endpoint timings only. GPU identity/utilization requires separate captured environment and device metrics. No GPU performance is inferred from CPU fixtures.",
    }


def run_benchmark(origin, cases, prompt, manifest, fingerprint, requests=100, concurrency=1, timeout=60, warmup=2, rate=None, allow_remote=False, token=None, max_tokens=128, on_result=None):
    if not 1 <= concurrency <= 64 or not 1 <= requests <= 10000 or not 0 <= warmup <= 20 or timeout <= 0 or (rate is not None and rate <= 0):
        raise ValueError("Invalid bounded benchmark settings")
    if not cases:
        raise ValueError("Empty workload")
    run_id = str(uuid.uuid4())
    for i in range(warmup):
        row = stream_request(origin, payload_for(cases[i % len(cases)], prompt, manifest["model"]["served_name"], max_tokens), timeout, allow_remote, token, f"warmup-{run_id}-{i}")
        if not row["ok"]:
            raise ValueError("Warmup failed: " + row["error"])
    rows = []
    start = time.perf_counter()
    slots = threading.BoundedSemaphore(concurrency)

    def execute(index, release_slot=False):
        try:
            case = cases[index % len(cases)]
            request_id = f"{run_id}-{index:05d}"
            result = stream_request(origin, payload_for(case, prompt, manifest["model"]["served_name"], max_tokens), timeout, allow_remote, token, request_id)
            if result["ok"] and result["server_manifest_sha256"] != fingerprint:
                result.update(ok=False, error="server_manifest_mismatch")
            result.update({"request_id": request_id, "index": index, "case_id": case["id"], "evidence_kind": "live-endpoint", "manifest_sha256": fingerprint})
            # Benchmark artifacts retain hashes, not generated text; eval capture is explicit.
            result["answer_sha256"] = digest_object(result.pop("answer"))
            if on_result:
                on_result(result)
            return result
        finally:
            if release_slot:
                slots.release()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        pending = set()
        if rate is not None:
            for i in range(requests):
                delay = start + i / rate - time.perf_counter()
                if delay > 0:
                    time.sleep(delay)
                if slots.acquire(blocking=False):
                    pending.add(pool.submit(execute, i, True))
                else:
                    dropped = {"index": i, "request_id": f"{run_id}-{i:05d}", "ok": False, "error": "load_generator_concurrency_limit", "evidence_kind": "live-endpoint", "manifest_sha256": fingerprint}
                    rows.append(dropped)
                    if on_result:
                        on_result(dropped)
            rows.extend(future.result() for future in concurrent.futures.as_completed(pending))
        else:
            index = 0
            while index < requests or pending:
                while index < requests and len(pending) < concurrency:
                    pending.add(pool.submit(execute, index))
                    index += 1
                finished, pending = concurrent.futures.wait(pending, return_when=concurrent.futures.FIRST_COMPLETED)
                rows.extend(future.result() for future in finished)
    duration = time.perf_counter() - start
    rows.sort(key=lambda row: row["index"])
    report = summarize(rows, duration, fingerprint, manifest["slo"])
    report.update({"run_id": run_id, "endpoint": origin, "timeout_s": timeout, "workload_sha256": digest_object(cases), "warmup_excluded": warmup, "concurrency": concurrency, "arrival_pattern": "paced-open-loop-with-explicit-client-drops" if rate else "closed-loop-bounded-concurrency", "requested_rate": rate, "max_output_tokens": max_tokens, "note": "Input/output token lengths come from actual usage; max_output_tokens is a cap, not a measured output length."})
    return rows, report
