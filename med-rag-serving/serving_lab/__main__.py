import argparse
import json
import os
import shutil
import sys
import threading
from pathlib import Path
from .benchmark import payload_for, run_benchmark
from .client import get_json, stream_request
from .common import digest_file, digest_object, read_json, read_jsonl, safe_path, snapshot_runtime, write_json, write_jsonl
from .fixtures import cpu_demo
from .manifest import load_manifest
from .quality import evaluate
from .release import export_env, prepare, record_deployment, rollback_plan


def parser():
    cli = argparse.ArgumentParser(description="MED-RAG Serving Lab. No GPU or paid endpoint runs without an explicit --execute.")
    subs = cli.add_subparsers(dest="command", required=True)
    demo = subs.add_parser("cpu-demo", help="Generate clearly simulated controls; no network or GPU")
    demo.add_argument("--out", required=True)
    rehearsal = subs.add_parser("rehearsal", help="Record real loopback HTTP contracts with a scripted CPU upstream")
    rehearsal.add_argument("--out", required=True)
    lock = subs.add_parser("lock", help="Copy a template and local corpus; lock operator-verified immutable pins offline")
    lock.add_argument("--template", default="manifest.template.json")
    lock.add_argument("--out", required=True, help="New experiment directory")
    for name in ("revision", "tokenizer-revision", "vllm-image", "python-image", "prometheus-image"):
        lock.add_argument("--" + name, required=True)
    check = subs.add_parser("validate-manifest")
    check.add_argument("manifest")
    check.add_argument("--allow-simulated", action="store_true")
    env = subs.add_parser("export-env", help="Offline candidate lab configuration; not a production promotion")
    env.add_argument("--manifest", required=True)
    env.add_argument("--out", required=True)
    env.add_argument("--gpu-device-uuid", required=True)
    gate = subs.add_parser("evaluate", help="Offline contract gate; nonzero exit blocks a bad candidate")
    gate.add_argument("--manifest", required=True)
    gate.add_argument("--responses", required=True)
    gate.add_argument("--out", required=True)
    gate.add_argument("--allow-simulated", action="store_true")
    for name in ("capture-eval", "benchmark", "health", "record-deployment"):
        cmd = subs.add_parser(name)
        cmd.add_argument("--endpoint", default="http://127.0.0.1:18080")
        cmd.add_argument("--execute", action="store_true", help="Actually send requests to the explicitly selected lab endpoint")
        cmd.add_argument("--allow-remote", action="store_true")
        cmd.add_argument("--token-env", default="SERVING_LAB_API_KEY")
        if name in ("capture-eval", "benchmark"):
            cmd.add_argument("--manifest", required=True)
            cmd.add_argument("--out", required=True, help="New output directory")
            cmd.add_argument("--timeout", type=float, default=60)
            cmd.add_argument("--max-tokens", type=int, default=128)
        if name == "benchmark":
            cmd.add_argument("--requests", type=int, default=100)
            cmd.add_argument("--concurrency", type=int, default=1)
            cmd.add_argument("--warmup", type=int, default=2)
            cmd.add_argument("--rate", type=float)
        if name == "record-deployment":
            cmd.add_argument("--release", required=True)
            cmd.add_argument("--state", required=True)
    release = subs.add_parser("prepare-release", help="Offline gates and immutable artifact preparation; never deploys")
    for name in ("manifest", "responses", "raw", "benchmark", "out"):
        release.add_argument("--" + name, required=True)
    release.add_argument("--allow-simulated", action="store_true")
    rollback = subs.add_parser("rollback-plan", help="Verify previous artifact and print manual rollback steps")
    rollback.add_argument("--state", required=True)
    gateway = subs.add_parser("gateway", help="Run the local-lab proxy (does not start a GPU engine)")
    gateway.add_argument("--manifest", required=True)
    gateway.add_argument("--upstream", default="http://engine:8000")
    gateway.add_argument("--host", default="127.0.0.1")
    gateway.add_argument("--port", type=int, default=8080)
    gateway.add_argument("--max-inflight", type=int, default=4)
    gateway.add_argument("--deadline", type=float, default=120)
    return cli


def main(argv=None):
    args = parser().parse_args(argv)
    command = args.command
    if hasattr(args, "execute") and not args.execute:
        raise ValueError("No request sent. Add --execute only after confirming the isolated endpoint, available GPU and cost limits.")
    token = os.environ.get(args.token_env) if hasattr(args, "token_env") else None
    if command == "cpu-demo":
        result = cpu_demo(args.out)
    elif command == "rehearsal":
        from .rehearsal import rehearsal
        report = rehearsal(args.out)
        result = {"run_id": report["run_id"], "contracts_passed": report["contracts_passed"], "scope": report["scope"], "evidence": str(Path(args.out) / "evidence.json")}
    elif command == "lock":
        source = Path(args.template).resolve()
        target = Path(args.out).resolve()
        if target.exists():
            raise ValueError("Lock output must be a new experiment directory")
        manifest = read_json(source)
        manifest["model"].update(revision=args.revision, tokenizer_revision=args.tokenizer_revision)
        manifest["images"].update(vllm=args.vllm_image, python=args.python_image, prometheus=args.prometheus_image)
        target.mkdir(parents=True)
        for key in ("prompt", "dataset"):
            item = manifest[key]
            old, new = safe_path(source.parent, item["path"]), safe_path(target, item["path"])
            new.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(old, new)
            item["sha256"] = digest_file(new)
        manifest["runtime"]["sha256"] = snapshot_runtime(Path(__file__).resolve().parents[1], safe_path(target, manifest["runtime"]["path"]))
        write_json(target / "manifest.json", manifest)
        _, _, fingerprint = load_manifest(target / "manifest.json")
        result = {"manifest": str(target / "manifest.json"), "manifest_sha256": fingerprint, "note": "Pins were checked syntactically and local files hashed. Registry/model existence and GPU compatibility require operator verification."}
    elif command == "validate-manifest":
        _, _, fingerprint = load_manifest(args.manifest, args.allow_simulated)
        result = {"status": "valid", "manifest_sha256": fingerprint}
    elif command == "export-env":
        result = {"path": str(export_env(args.manifest, args.out, args.gpu_device_uuid)), "status": "configuration-only-no-service-started"}
    elif command == "evaluate":
        manifest, root, fingerprint = load_manifest(args.manifest, args.allow_simulated)
        result = evaluate(read_jsonl(safe_path(root, manifest["dataset"]["path"])), read_jsonl(args.responses), fingerprint, manifest["acceptance"], "simulated-cpu" if manifest.get("test_fixture") else "live-endpoint")
        write_json(args.out, result)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["status"] == "pass" else 2
    elif command in ("capture-eval", "benchmark"):
        manifest, root, fingerprint = load_manifest(args.manifest)
        if not 1 <= args.max_tokens <= 512:
            raise ValueError("max-tokens must be in [1,512]")
        target = Path(args.out).resolve()
        if target.exists():
            raise ValueError("Run output must be a new directory")
        readiness = get_json(args.endpoint, "/ready", allow_remote=args.allow_remote, token=token)
        if readiness.get("status") != "ready" or readiness.get("manifest_sha256") != fingerprint or readiness.get("model") != manifest["model"]["served_name"]:
            raise ValueError("Selected endpoint does not serve this locked manifest")
        cases = read_jsonl(safe_path(root, manifest["dataset"]["path"]))
        prompt = safe_path(root, manifest["prompt"]["path"]).read_text(encoding="utf-8")
        target.mkdir(parents=True)
        write_json(target / "manifest.json", manifest)
        if command == "capture-eval":
            rows = []
            for case in cases:
                row = stream_request(args.endpoint, payload_for(case, prompt, manifest["model"]["served_name"], args.max_tokens), args.timeout, args.allow_remote, token, case["id"])
                if row["ok"] and row["server_manifest_sha256"] != fingerprint:
                    row.update(ok=False, error="server_manifest_mismatch")
                row.update(id=case["id"], manifest_sha256=fingerprint, evidence_kind="live-endpoint")
                rows.append(row)
                write_jsonl(target / "responses.jsonl", rows)
            result = evaluate(cases, rows, fingerprint, manifest["acceptance"], "live-endpoint")
            write_json(target / "quality-gate.json", result)
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 0 if result["status"] == "pass" else 2
        journal_lock = threading.Lock()
        def journal(row):
            with journal_lock:
                with (target / "benchmark.raw.jsonl").open("a", encoding="utf-8") as handle:
                    handle.write(json.dumps(row, ensure_ascii=False) + "\n")
        rows, result = run_benchmark(args.endpoint, cases, prompt, manifest, fingerprint, args.requests, args.concurrency, args.timeout, args.warmup, args.rate, args.allow_remote, token, args.max_tokens, on_result=journal)
        write_jsonl(target / "benchmark.raw.jsonl", rows)
        write_json(target / "benchmark.json", result)
    elif command == "health":
        result = get_json(args.endpoint, "/ready", allow_remote=args.allow_remote, token=token)
    elif command == "prepare-release":
        result = {"status": "prepared-not-deployed", "path": str(prepare(args.manifest, args.responses, args.raw, args.benchmark, args.out, args.allow_simulated))}
    elif command == "record-deployment":
        readiness = get_json(args.endpoint, "/ready", allow_remote=args.allow_remote, token=token)
        result = record_deployment(args.release, args.state, readiness)
    elif command == "rollback-plan":
        result = rollback_plan(args.state)
    elif command == "gateway":
        from .gateway import serve
        serve(args.manifest, args.upstream, args.host, args.port, args.max_inflight, args.deadline)
        return 0
    else:
        raise ValueError("Unknown command")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(2)
