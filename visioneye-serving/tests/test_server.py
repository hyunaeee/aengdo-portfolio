"""Dependency-free lifecycle tests with a scripted worker, never model evidence."""
import base64
import json
import os
from pathlib import Path
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
import urllib.request
import urllib.error

import server


def scripted_worker(pipe, model, runtime):
    pipe.send({"type": "ready", "device": "cpu", "model_sha256": server.MODEL_SHA256})
    while True:
        item = pipe.recv()
        if item["fault"] == "crash":
            os._exit(73)
        if item["fault"] == "stall":
            time.sleep(20)
        pipe.send({"type": "result", "request_id": item["request_id"], "value": item["image"].decode()})


class InputTests(unittest.TestCase):
    def test_invalid_payloads(self):
        for value in [b"{", b"[]", b"{}", b'{"image_base64":"?"}', b'{"image_base64":12}', b'{"image_base64":""}', b'{"image_base64":"eA==","url":"http://x"}']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                server.decode_payload(value)

    def test_body_decoding(self):
        self.assertEqual(server.decode_payload(b'{"image_base64":"eA=="}'), b"x")

    def test_model_mismatch_fails_before_spawn(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)/"model.pt"
            path.write_bytes(b"wrong")
            with self.assertRaisesRegex(ValueError, "SHA256"):
                server.Supervisor(path, tmp, Path(tmp)/"events")


class LifecycleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.token = "unit-test-token-only-32-characters"
        with patch("server.digest", return_value=server.MODEL_SHA256):
            self.httpd = server.make_server("unused", self.tmp.name, Path(self.tmp.name)/"events", self.token,
                                            deadline=0.4, allow_test_faults=True, worker_target=scripted_worker)
        self.thread = threading.Thread(target=self.httpd.serve_forever, kwargs={"poll_interval": 0.01})
        self.thread.start()
        self.ready()

    def tearDown(self):
        server.close_server(self.httpd)
        self.thread.join(2)
        self.assertIsNone(self.httpd.supervisor.process)
        self.tmp.cleanup()

    def ready(self):
        deadline = time.monotonic()+5
        while time.monotonic()<deadline:
            if self.httpd.supervisor.health()["ready"]:
                return
            time.sleep(0.02)
        self.fail("No ready worker")

    def request(self, path, text="x", authorized=True):
        headers = {"Content-Type": "application/json"}
        if authorized:
            headers["Authorization"] = "Bearer " + self.token
        body = json.dumps({"image_base64": base64.b64encode(text.encode()).decode()}).encode()
        req = urllib.request.Request(f"http://127.0.0.1:{self.httpd.server_port}"+path, data=body, headers=headers)
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            response = opener.open(req, timeout=4)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            return response.status, json.loads(response.read())

    def test_crash_reloads_and_accepts_next_request(self):
        old = self.httpd.supervisor.generation
        self.assertEqual(self.request("/__test/crash")[0], 503)
        self.ready()
        status, data = self.request("/predict", "after-crash")
        self.assertEqual((status, data["value"]), (200, "after-crash"))
        self.assertGreater(data["generation"], old)

    def test_deadline_discards_pipe_and_releases_capacity(self):
        results = []
        job = threading.Thread(target=lambda: results.append(self.request("/__test/stall")))
        job.start()
        deadline = time.monotonic()+2
        while self.httpd.supervisor.state != "busy" and time.monotonic()<deadline:
            time.sleep(0.005)
        self.assertEqual(self.request("/predict")[0], 429)
        job.join(3)
        self.assertEqual(results[0][0], 504)
        self.ready()
        status, data = self.request("/predict", "fresh")
        self.assertEqual((status, data["value"]), (200, "fresh"))
        self.assertEqual(self.httpd.supervisor.health()["inflight"], 0)

    def test_auth_rejects_before_model(self):
        self.assertEqual(self.request("/predict", authorized=False)[0], 401)
        self.assertEqual(self.httpd.supervisor.request_serial, 0)

    def test_unknown_route_does_not_infer(self):
        self.assertEqual(self.request("/missing")[0], 404)
        self.assertEqual(self.httpd.supervisor.request_serial, 0)


if __name__ == "__main__":
    unittest.main()
