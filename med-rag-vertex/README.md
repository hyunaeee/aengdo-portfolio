# med-rag-vertex 🏥

**Cloud-native port of [med-rag](https://github.com/hyunaeee/med-rag) — a clinical
RAG assistant delivered to Korea University Anam Hospital (Oct 2025) — rebuilt on
Google Cloud Vertex AI with ADK multi-agent orchestration and an evaluation pipeline.**

The original system runs **on-prem Gemma (gemma3:27b via Ollama)** because patient
data cannot leave the hospital network. This port answers the follow-up question:
*what does the same system look like as a cloud-native, enterprise-grade service?*

| | on-prem (shipped) | this port |
|---|---|---|
| LLM | Gemma 3 27B / Ollama | **Gemini 2.5 Flash / Vertex AI** |
| Embeddings | MiniLM (local) | **gemini-embedding-001** |
| Orchestration | single LangChain chain | **ADK `SequentialAgent`: researcher → safety reviewer** |
| Evaluation | manual spot checks | **LLM-judge pipeline + latency / tokens-per-sec / cost-per-request** |
| Vector store | Chroma | Chroma (swappable for Vertex AI Vector Search — isolated in `retrieval.py`) |

## Architecture

```
clinician question
      │
      ▼
┌─ medrag_pipeline (ADK SequentialAgent) ─────────────────────┐
│                                                             │
│  clinical_researcher (Gemini 2.5 Flash)                     │
│    ├─ tool: search_cases()      ← past anonymized cases     │
│    ├─ tool: search_guidelines() ← newest-first guidelines   │
│    └─ drafts answer → state["draft_answer"]                 │
│                                                             │
│  safety_reviewer (self-reflection pass)                     │
│    └─ verifies grounding · case-match · uncertainty         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
      │
      ▼            Chroma (cosine) + gemini-embedding-001 @ 768d
reviewed answer    chunking identical to shipped system (800/100)
```

Design decisions carried over from the hospital deployment:

- **Cases before guidelines.** Clinicians trust precedent; guidelines are the
  fallback when case evidence is thin — with newest-guideline-first re-ranking.
- **Case-match guardrail.** Same age/sex ≠ same case. The researcher must check
  symptom similarity before citing a retrieved case, and the reviewer re-checks it.
- **Decision support, not decisions.** Uncertainty is stated; the clinician owns
  the final call.

## Quickstart

```bash
pip install -r requirements.txt
gcloud auth application-default login
cp .env.example .env   # set GOOGLE_CLOUD_PROJECT

# 1. index documents (a synthetic demo corpus ships in docs_cases/ and docs_guides/)
python ingest.py

# 2. talk to the agent
adk web        # pick "medrag_agent" — or: adk run medrag_agent

# 3. run the evaluation pipeline
python -m eval.run_eval          # writes eval/report.md
```

## Evaluation

`eval/run_eval.py` drives the **same `root_agent`** that `adk web` serves — not a
simplified stand-in — over `eval/evalset.jsonl` (synthetic, PHI-free clinical
questions), and grades each answer with a Gemini 2.5 Pro judge:

- **groundedness** — every claim traceable to retrieved evidence
- **relevance** — answers the actual clinical question
- **safety** — red flags kept, uncertainty stated, no prescribing without data
  (q08 deliberately tests refusal on missing patient info)

plus runtime metrics captured per request: **latency p50/p95, output tokens/sec,
cost-per-request** (pricing table in `medrag_agent/config.py`). Results are
written to `eval/report.md`; raw per-request metrics to `eval/metrics_*.jsonl`.

### Measured results (2026-07-20, synthetic demo corpus)

| pass rate | groundedness | relevance | safety | latency p50 / p95 | tokens/sec | cost/request |
|---|---|---|---|---|---|---|
| **8/8** | 4.75 / 5 | 5.0 / 5 | 5.0 / 5 | 32.6s / 57.2s | 48.1 | **$0.0060** |

Full per-case verdicts in [`eval/report.md`](eval/report.md). The whole
8-question run, judge included, cost $0.065.

The eval already earned its keep during development: the first smoke run
caught the safety reviewer collapsing an approved draft into a one-line
"Reviewed" note (judge score 1/1/1). One instruction fix later the same
question scored 5/5/5 — exactly the class of regression this pipeline exists
to catch.

## Repository layout

```
medrag_agent/          ADK agent package (adk web discovers root_agent here)
├── agent.py           researcher → safety-reviewer SequentialAgent
├── retrieval.py       Vertex AI embeddings + Chroma, search tools
├── telemetry.py       latency / tokens-per-sec / cost accounting
└── config.py          models, chunking, pricing
ingest.py              document → chunks → embeddings → index
eval/
├── evalset.jsonl      synthetic eval questions + expected-behavior rubrics
└── run_eval.py        agent runner + LLM judge + report generator
```

## Notes

- No patient data ships with this repo. The included `docs_cases/` and
  `docs_guides/` corpus is fully synthetic (each file is marked as such), the
  eval set is synthetic, and the vector index is git-ignored. Real clinical
  documents must never be committed.
- This is a portfolio companion to the delivered on-prem system, demonstrating
  the same clinical-RAG design on Google Cloud's AI stack.

---
© 2026 [aengdo](https://hyunaeee.github.io/aengdo-portfolio/en.html) · hyunaeee@gmail.com
