"""Parse configuration only. This never pulls images or contacts a GPU engine."""
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


@unittest.skipUnless(shutil.which("docker"), "Docker CLI absent; config-only verification skipped")
class ComposeConfigTests(unittest.TestCase):
    def test_compose_isolated_ports_and_explicit_gpu_digest(self):
        root = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as directory:
            environment = dict(os.environ)
            # Deliberately fake pins for config parsing, never inference/deployment.
            digest = "0123456789abcdef" * 4
            environment.update(VLLM_IMAGE="fixture.invalid/vllm@sha256:" + digest, PYTHON_IMAGE="fixture.invalid/python@sha256:" + digest, PROMETHEUS_IMAGE="fixture.invalid/prometheus@sha256:" + digest, MODEL_ID="fixture/model", MODEL_REVISION="0123456789abcdef" * 2 + "01234567", TOKENIZER_REVISION="0123456789abcdef" * 2 + "01234567", SERVED_MODEL="fixture-model", MODEL_DTYPE="bfloat16", MAX_MODEL_LEN="2048", MAX_NUM_SEQS="4", GPU_MEMORY_UTILIZATION="0.7", RELEASE_DIR=Path(directory).as_posix(), GPU_DEVICE_UUID="GPU-00000000-0000-0000-0000-000000000000", LAB_PORT="18080")
            result = subprocess.run([shutil.which("docker"), "compose", "--project-name", "medrag-serving-cpu-config-test", "-f", str(root / "compose.yaml"), "config", "--format", "json"], env=environment, capture_output=True, text=True, timeout=20)
            self.assertEqual(result.returncode, 0, result.stderr)
            config = json.loads(result.stdout)
            engine, gateway = config["services"]["engine"], config["services"]["gateway"]
            self.assertNotIn("ports", engine)
            self.assertEqual(gateway["ports"][0]["host_ip"], "127.0.0.1")
            self.assertEqual(str(gateway["ports"][0]["published"]), "18080")
            self.assertIn("@sha256:", engine["image"])
            devices = engine["deploy"]["resources"]["reservations"]["devices"]
            self.assertEqual(devices[0]["device_ids"], [environment["GPU_DEVICE_UUID"]])
            self.assertTrue(gateway["read_only"])
            self.assertEqual(gateway["environment"]["VLLM_IMAGE"], engine["image"])
            for flag, variable in (("--model", "MODEL_ID"), ("--revision", "MODEL_REVISION"), ("--tokenizer-revision", "TOKENIZER_REVISION"), ("--served-model-name", "SERVED_MODEL"), ("--dtype", "MODEL_DTYPE"), ("--max-model-len", "MAX_MODEL_LEN"), ("--max-num-seqs", "MAX_NUM_SEQS"), ("--gpu-memory-utilization", "GPU_MEMORY_UTILIZATION")):
                self.assertEqual(gateway["environment"][variable], engine["command"][engine["command"].index(flag) + 1])
            self.assertEqual(gateway["environment"]["PYTHON_IMAGE"], gateway["build"]["args"]["PYTHON_IMAGE"])


if __name__ == "__main__":
    unittest.main()
