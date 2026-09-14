# CPU gateway rehearsal — 2026-09-14

[Interactive explorer](https://hyunaeee.github.io/aengdo-portfolio/work/serving-lab/) · [English](https://hyunaeee.github.io/aengdo-portfolio/work/serving-lab/en.html) · [Raw JSON](evidence.json) · [Counters](gateway.prom)

Run `cpu-91fe7e3fc879`, Windows, Python 3.12.14. The actual gateway and streaming client connect to a scripted CPU upstream on temporary loopback ports. Both servers stop after verification. No GPU, external endpoint, model, container or existing service is accessed.

| Contract | Observed |
|---|---|
| Readiness and normal SSE | 200; matching manifest and complete stream |
| Four occupied slots | Fifth request rejected with 429; held requests finish and release slots |
| Failed upstream health | Readiness 503 |
| Injected upstream 503 | Request failure 503 |
| SSE without `[DONE]` | HTTP 200 is recorded as `missing_done`, not success |
| Upstream withholds response headers | One-second gateway deadline returns 504 |
| Remove injected fault | Readiness and complete SSE return to 200 |
| Final metrics | 10 requests: 6 completed, 1 rejected, 3 upstream errors; 0 inflight |
| Good quality controls | 12/12 pass; artifact prepared, not deployed |
| Defective controls | 2/12 fail; release directory never created |
| Edited benchmark summary | Recalculation from raw records blocks packaging |

Fourteen assertions cover these checks; readiness, streaming and final metrics have separate assertions. The Python suite contains 31 tests covering protocol parsing, provenance, packaging, command guards, configuration and this rehearsal.

Upstream replies and quality answers are fixed synthetic fixtures. The quality gate uses rules and expected strings, not an independent semantic or clinical judge. `at_ms` preserves event order; it is not model latency, GPU throughput or a recovery-time benchmark. Removing a fault does not establish rollout/rollback behavior. Gateway `/metrics` is captured directly; Prometheus scraping and alert firing remain untested.

```sh
cd med-rag-serving
python -m unittest discover -s tests -v
python -m serving_lab rehearsal --out artifacts/my-run
```

Choose a new output folder. The command writes `evidence.json`, `gateway.prom`, and clearly marked synthetic controls. Run IDs and event times vary; contract outcomes and counters are checked rather than hard-coded into the report.

The website embeds the recorded JSON at build time. Browser interactions select existing records and never call a model. `node scripts/check-serving-evidence.cjs` from the repository root verifies assertions and normalized source hashes. Changed implementation requires a fresh record. Python 3.11/3.12 CI repeats the rehearsal and stores its artifacts.
