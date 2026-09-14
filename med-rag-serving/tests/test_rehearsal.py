import tempfile
import unittest
from pathlib import Path
from serving_lab.gateway import create_server
from serving_lab.rehearsal import rehearsal


class RehearsalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.tmp.cleanup)
        cls.path = Path(cls.tmp.name) / "run"
        cls.report = rehearsal(cls.path)
        cls.events = {event["id"]: event for event in cls.report["events"]}

    def test_real_http_exercises_stream_failure_and_recovery(self):
        self.assertTrue(self.events["normal"]["ok"])
        self.assertEqual(self.events["truncated"]["error"], "missing_done")
        self.assertEqual(self.events["deadline"]["http_status"], 504)
        self.assertEqual(self.events["not-ready"]["http_status"], 503)
        self.assertTrue(self.events["recovered"]["ok"])
        self.assertTrue(self.events["recovered"]["identity_matches"])

    def test_admission_slots_are_recovered_and_metrics_account_for_failures(self):
        self.assertEqual(self.events["capacity"]["http_status"], 429)
        self.assertEqual(self.report["metrics"], {"requests_total": 10, "rejected_total": 1, "completed_total": 6, "upstream_errors_total": 3, "disconnects_total": 0, "inflight": 0})
        self.assertTrue(self.events["slots-released"]["ok"])

    def test_release_gates_block_before_writing_bad_or_tampered_artifacts(self):
        self.assertEqual(self.report["quality"]["good"]["failed_cases"], 0)
        self.assertEqual(self.report["quality"]["bad"]["failed_cases"], 2)
        self.assertFalse((self.path / "controls/bad-releases").exists())
        self.assertFalse((self.path / "controls/tampered-releases").exists())
        self.assertEqual(self.report["release"]["good"], "prepared-not-deployed")

    def test_evidence_preserves_scope_source_hashes_and_complete_contracts(self):
        self.assertFalse(self.report["scope"]["gpu_executed"])
        self.assertFalse(self.report["scope"]["external_network"])
        self.assertFalse(self.report["scope"]["live_deployment"])
        self.assertEqual(self.report["contracts_passed"], 14)
        self.assertTrue(all(e["passed"] for e in self.report["events"]))
        self.assertEqual(len(self.report["source_sha256"]), 6)

    def test_existing_evidence_cannot_be_overwritten(self):
        with self.assertRaisesRegex(ValueError, "new output directory"):
            rehearsal(self.path)

    def test_fixture_gateway_rejects_public_bind_and_non_loopback_upstream(self):
        manifest = self.path / "controls/manifest.json"
        with self.assertRaisesRegex(ValueError, "127.0.0.1"):
            create_server(manifest, host="0.0.0.0", allow_simulated=True)
        with self.assertRaises(ValueError):
            create_server(manifest, upstream="https://example.com", allow_simulated=True)


if __name__ == "__main__":
    unittest.main()
