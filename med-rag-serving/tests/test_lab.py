import contextlib
import copy
import io
import json
import tempfile
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from serving_lab.__main__ import main
from serving_lab.benchmark import distribution, run_benchmark, summarize
from serving_lab.client import endpoint, sse_events, stream_request
from serving_lab.common import digest_object, read_json, read_jsonl, write_json, write_jsonl
from serving_lab.fixtures import cpu_demo
from serving_lab.gateway import bounded_payload, ready
from serving_lab.manifest import compose_values, load_manifest, validate_runtime_environment
from serving_lab.quality import evaluate, score_case
from serving_lab.release import export_env, prepare, record_deployment, rollback_plan


class FixtureTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "demo"
        self.demo = cpu_demo(self.root)
        self.manifest, _, self.sha = load_manifest(self.root / "manifest.json", True)
        self.cases = read_jsonl(self.root / "eval/cases.jsonl")
        self.good = read_jsonl(self.root / "good.responses.jsonl")

    def prepare(self, responses="good.responses.jsonl"):
        return prepare(self.root / "manifest.json", self.root / responses, self.root / "benchmark.raw.jsonl", self.root / "benchmark.json", self.root / "another-release", True)

    def test_cpu_demo_passes_good_and_blocks_bad_before_artifact_creation(self):
        self.assertEqual(self.demo["good_quality_gate"], "pass")
        self.assertEqual(self.demo["bad_candidate_release"], "blocked")
        self.assertFalse((self.root / "bad-releases").exists())
        bad = read_json(self.root / "bad.gate.json")
        reasons = {reason for row in bad["results"] for reason in row["reasons"]}
        self.assertIn("unknown_citation", reasons)
        self.assertIn("overrefusal", reasons)
        self.assertEqual(bad["overrefusal_count"], 1)

    def test_live_manifest_and_deployment_reject_cpu_fixture(self):
        with self.assertRaisesRegex(ValueError, "CPU test fixture"):
            load_manifest(self.root / "manifest.json")
        with self.assertRaisesRegex(ValueError, "CPU test fixture"):
            record_deployment(self.demo["simulated_release_dir"], self.root / "state.json", {"status": "ready", "manifest_sha256": self.sha})
        self.assertFalse((self.root / "state.json").exists())
        with self.assertRaisesRegex(ValueError, "CPU test fixture"):
            export_env(self.root / "manifest.json", self.root / "run.env", "GPU-12345678-1234-1234-1234-123456789abc")

    def test_modified_prompt_and_runtime_fail_manifest_hash(self):
        path = self.root / "eval/system-prompt.txt"
        path.write_text("different", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "prompt content hash mismatch"):
            load_manifest(self.root / "manifest.json", True)
        (self.root / "runtime/compose.yaml").write_text("different", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "runtime content hash mismatch"):
            load_manifest(self.root / "manifest.json", True)

    def test_missing_duplicate_and_mixed_candidate_responses_rejected(self):
        for rows in (self.good[:-1], self.good + self.good[:1]):
            with self.assertRaises(ValueError):
                evaluate(self.cases, rows, self.sha, self.manifest["acceptance"], "simulated-cpu")
        self.good[0]["manifest_sha256"] = "wrong"
        with self.assertRaisesRegex(ValueError, "provenance"):
            evaluate(self.cases, self.good, self.sha, self.manifest["acceptance"], "simulated-cpu")

    def test_missing_citation_fabricated_quote_and_overrefusal(self):
        case = self.cases[0]
        self.assertIn("missing_citation", score_case(case, {"answer": "09:00 17:00"})["reasons"])
        self.assertIn("fabricated_quote", score_case(case, {"answer": '09:00 17:00 "24시간 운영" [library.md]'})["reasons"])
        self.assertTrue(score_case(case, {"answer": case["reference_answer"]})["pass"])
        self.assertIn("missing_abstention", score_case(self.cases[-1], {"answer": "60일 보관합니다."})["reasons"])

    def test_quality_gate_cli_has_nonzero_exit_for_bad_candidate(self):
        with contextlib.redirect_stdout(io.StringIO()):
            code = main(["evaluate", "--manifest", str(self.root / "manifest.json"), "--responses", str(self.root / "bad.responses.jsonl"), "--out", str(self.root / "cli.gate.json"), "--allow-simulated"])
        self.assertEqual(code, 2)

    def test_release_recomputes_raw_report_and_rejects_tampering(self):
        report = read_json(self.root / "benchmark.json")
        report["goodput_ratio"] = 0.8
        write_json(self.root / "benchmark.json", report)
        with self.assertRaisesRegex(ValueError, "does not match raw"):
            self.prepare()
        self.assertFalse((self.root / "another-release").exists())

    def test_gate_pass_summary_cannot_hide_bad_raw_quality(self):
        write_json(self.root / "bad.gate.json", {"status": "pass"})
        with self.assertRaisesRegex(ValueError, "quality gate"):
            self.prepare("bad.responses.jsonl")

    def test_unknown_usage_blocks_goodput_release(self):
        rows = read_jsonl(self.root / "benchmark.raw.jsonl")
        rows[0]["output_tokens"] = None
        rows[0]["tpot_ms"] = None
        report = summarize(rows, 1, self.sha, self.manifest["slo"], "simulated-cpu")
        report["workload_sha256"] = digest_object(self.cases)
        # At a strict 100% gate even one unknown TPOT must block release.
        manifest = copy.deepcopy(self.manifest)
        manifest["acceptance"]["min_goodput_ratio"] = 1
        new_sha = digest_object(manifest)
        for row in rows:
            row["manifest_sha256"] = new_sha
        for row in self.good:
            row["manifest_sha256"] = new_sha
        report = summarize(rows, 1, new_sha, manifest["slo"], "simulated-cpu")
        report["workload_sha256"] = digest_object(self.cases)
        write_json(self.root / "manifest.json", manifest)
        write_jsonl(self.root / "good.responses.jsonl", self.good)
        write_jsonl(self.root / "benchmark.raw.jsonl", rows)
        write_json(self.root / "benchmark.json", report)
        with self.assertRaisesRegex(ValueError, "goodput"):
            self.prepare()

    def test_release_is_immutable(self):
        self.prepare()
        with self.assertRaisesRegex(ValueError, "never overwritten"):
            self.prepare()

    def test_first_deployment_has_no_rollback_target(self):
        write_json(self.root / "state.json", {"current": {"manifest_sha256": self.sha}, "previous": None})
        with self.assertRaisesRegex(ValueError, "No previous"):
            rollback_plan(self.root / "state.json")

    def test_template_unresolved_pins_cannot_be_mistaken_for_live_manifest(self):
        source = Path(__file__).resolve().parents[1] / "manifest.template.json"
        with self.assertRaisesRegex(ValueError, "immutable.*commit"):
            load_manifest(source)

    def test_runtime_environment_rejects_missing_and_changed_compose_values(self):
        expected = compose_values(self.manifest)
        validate_runtime_environment(self.manifest, self.root, expected, 4)
        for key in expected:
            changed = dict(expected)
            changed[key] = "unexpected"
            with self.assertRaisesRegex(ValueError, key):
                validate_runtime_environment(self.manifest, self.root, changed, 4)
        with self.assertRaisesRegex(ValueError, "Runtime environment"):
            validate_runtime_environment(self.manifest, self.root, {}, 4)
        with self.assertRaisesRegex(ValueError, "admission bound"):
            validate_runtime_environment(self.manifest, self.root, expected, 8)

    def test_running_code_must_match_frozen_runtime(self):
        (self.root / "runtime/serving_lab/gateway.py").write_text("different code", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Running gateway code"):
            validate_runtime_environment(self.manifest, self.root, compose_values(self.manifest), 4)


class StreamTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fingerprint = "fixture-http-only"
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass
            def do_GET(self):
                body = json.dumps({"data": [{"id": "test-model"}]} if self.path == "/v1/models" else {"status": "ok"}).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            def do_POST(self):
                payload = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                mode = payload.get("test_mode", "good")
                self.send_response(429 if mode == "429" else 200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("X-Serving-Manifest", StreamTests.fingerprint)
                self.end_headers()
                if mode == "429":
                    return
                try:
                    model = "wrong-model" if mode == "wrong-model" else payload["model"]
                    def event(obj):
                        self.wfile.write(("data: " + json.dumps(obj, ensure_ascii=False) + "\n\n").encode())
                        self.wfile.flush()
                    event({"model": model, "choices": [{"delta": {"role": "assistant"}}]})
                    if mode == "timeout":
                        time.sleep(.12)
                    event({"model": model, "choices": [{"delta": {"content": "안녕"}}]})
                    time.sleep(.01)
                    event({"model": model, "choices": [{"delta": {"content": "하세요"}, "finish_reason": "stop"}]})
                    if mode != "no-usage":
                        event({"model": model, "choices": [], "usage": {"prompt_tokens": 12, "completion_tokens": 5}})
                    if mode != "missing-done":
                        self.wfile.write(b"data: [DONE]\n\n")
                        self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                    pass
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.server.daemon_threads = True
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, mode="good", timeout=2):
        return stream_request(self.origin, {"model": "test-model", "test_mode": mode}, timeout=timeout)

    def test_sse_multiline_unicode_comments_and_truncation(self):
        rows = [b": heartbeat\r\n", b"event: message\n", b"data: {\n", 'data: "text": "한글"}\n'.encode(), b"\n"]
        self.assertEqual(json.loads(list(sse_events(rows))[0]), {"text": "한글"})
        with self.assertRaisesRegex(ValueError, "Truncated"):
            list(sse_events([b"data: broken\n"]))

    def test_ttft_excludes_role_and_tpot_uses_tokens_not_chunks(self):
        row = self.request()
        self.assertTrue(row["ok"], row)
        self.assertEqual(row["answer"], "안녕하세요")
        self.assertEqual(row["content_events"], 2)
        self.assertEqual(row["output_tokens"], 5)
        self.assertAlmostEqual(row["tpot_ms"], row["content_span_ms"] / 4)
        self.assertLess(row["ttft_ms"], row["e2e_ms"])

    def test_missing_usage_never_invents_token_counts(self):
        row = self.request("no-usage")
        self.assertTrue(row["ok"])
        self.assertIsNone(row["tpot_ms"])
        self.assertIsNone(row["output_tokens"])

    def test_truncated_wrong_model_429_and_timeout_are_failures(self):
        for mode, expected in (("missing-done", "missing_done"), ("wrong-model", "served_model_mismatch"), ("429", "http_429"), ("timeout", "timeout")):
            row = self.request(mode, timeout=.03 if mode == "timeout" else 2)
            self.assertFalse(row["ok"])
            self.assertEqual(row["error"], expected)

    def test_real_http_client_report_keeps_all_requests_without_text(self):
        # This local fake HTTP server is a protocol test, never GPU evidence.
        cases = [{"id": "test", "context": [], "question": "synthetic"}]
        manifest = {"model": {"served_name": "test-model"}, "slo": {"ttft_ms": 1000, "tpot_ms": 1000, "e2e_ms": 2000}}
        rows, report = run_benchmark(self.origin, cases, "synthetic", manifest, self.fingerprint, requests=20, concurrency=2, warmup=0)
        self.assertEqual(report["requests"], 20)
        self.assertEqual(report["completed"], 20)
        self.assertIsNotNone(report["latency_ms"]["ttft_ms"]["p95"])
        self.assertIsNone(report["gpu_measurements"])
        self.assertNotIn("answer", rows[0])
        self.assertEqual(report["raw_sha256"], digest_object(rows))

    def test_paced_overload_accounts_for_explicit_client_drops(self):
        cases = [{"id": "test", "context": [], "question": "synthetic"}]
        manifest = {"model": {"served_name": "test-model"}, "slo": {}}
        rows, report = run_benchmark(self.origin, cases, "synthetic", manifest, self.fingerprint, requests=20, concurrency=1, warmup=0, rate=1000)
        self.assertEqual(len(rows), 20)
        self.assertTrue(any(row.get("error") == "load_generator_concurrency_limit" for row in rows))
        self.assertGreater(report["error_rate"], 0)

    def test_remote_and_execution_guards(self):
        with self.assertRaisesRegex(ValueError, "Remote endpoint"):
            endpoint("https://example.com")
        with self.assertRaisesRegex(ValueError, "No request sent"):
            main(["benchmark", "--manifest", "does-not-exist", "--out", "does-not-exist"])

    def test_readiness_requires_expected_served_model(self):
        status = ready(self.origin, "test-model", "configured-test-manifest")
        self.assertEqual(status["status"], "ready")
        self.assertEqual(status["manifest_sha256"], "configured-test-manifest")
        with self.assertRaisesRegex(ValueError, "does not match"):
            ready(self.origin, "unexpected-model", "configured-test-manifest")

    def test_percentiles_and_invalid_measurements(self):
        self.assertIsNone(distribution([1, 2, 3])["p95"])
        row = {"request_id": "x", "ok": True, "evidence_kind": "simulated-cpu", "manifest_sha256": "x", "ttft_ms": float("nan")}
        with self.assertRaisesRegex(ValueError, "Invalid raw measurement"):
            summarize([row], 1, "x", {}, "simulated-cpu")

    def test_gateway_rejects_generation_bound_bypasses_and_nonobject_body(self):
        request = {"model": "test-model", "messages": [{"role": "user", "content": "synthetic"}], "stream": True, "max_tokens": 128}
        self.assertEqual(bounded_payload(request, "test-model")["n"], 1)
        for changed in ([], {**request, "n": 2}, {**request, "max_completion_tokens": 10000}, {**request, "max_tokens": True}, {**request, "max_tokens": 513}, {**request, "temperature": float("nan")}):
            with self.assertRaises(ValueError):
                bounded_payload(changed, "test-model")


if __name__ == "__main__":
    unittest.main()
