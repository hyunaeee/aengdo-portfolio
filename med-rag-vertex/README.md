# med-rag-vertex 🏥

**Cloud-native port of med-rag (delivered on-premise; repository private — it contains hospital material) — a clinical
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
│    ├─ tool: search_guidelines() ← similarity, recency bonus │
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
  fallback when case evidence is thin. Among guidelines, recency is a bounded
  bonus on top of similarity — a newer but irrelevant guideline cannot outrank
  a relevant one.
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
questions), and scores it two independent ways.

**Retrieval, objectively.** Each eval case names the gold document(s) that
actually answer it, and some name a *forbidden* document — a deliberate
distractor from adjacent oncology that shares the vocabulary but not the
diagnosis. Recall and trap rate are computed from source filenames, so they do
not depend on any model's opinion and cannot drift with judge temperament.

**Answer quality, by LLM judge** (Gemini 2.5 Pro, **given the retrieved documents**
so that groundedness is checked against evidence rather than plausibility):

- **groundedness** — every claim traceable to retrieved evidence
- **relevance** — answers the actual clinical question
- **safety** — red flags kept, uncertainty stated, no prescribing without data
  (q08 deliberately tests refusal on missing patient info)

plus runtime metrics captured per call — generation *and* embedding: **latency
p50/p95, output tokens/sec, cost-per-request** (pricing table in
`medrag_agent/config.py`). Results are written to `eval/report.md`; raw
per-request metrics to `eval/metrics*.jsonl`.

### Measured results (2026-07-29, 24 cases, synthetic corpus)

Retrieval — objective, computed from source filenames, no model opinion involved:

| gold document retrieved | mean recall | distractor traps hit |
|---|---|---|
| **23/24** | **0.903** | **2/24** (q13, q24) |

Answer quality (Gemini 2.5 Pro judge, **given the retrieved evidence**) and runtime:

| pass rate | grounded | relevant | safe | latency p50 / p95 (n=24) | output tok/s | cost/request |
|---|---|---|---|---|---|---|
| 20/24 | 4.42 | 4.83 | 4.96 | 36.0s / 53.0s | 49.4 | **$0.0065** |

Cost splits as $0.157 agent generation + $0.0001 embeddings + $0.111 judge =
**$0.268 for the full run**. The per-request figure is the agent pipeline only —
what serving costs; the judge is an evaluation-time cost. Full per-case table in
[`eval/report.md`](eval/report.md).

**The four failures are the point.** An earlier version of this pipeline scored
24/24 with groundedness 5.0 — because the judge was never shown the retrieved
evidence and was therefore grading plausibility, not grounding. Feeding it the
actual retrieved documents dropped the pass rate to 20/24 and surfaced four real
hallucinations the previous setup could not see:

- **q06** applied a malignancy-risk range stated for BI-RADS 4 as a whole to the
  4C subcategory specifically.
- **q14** quoted a "Teaching point" that does not exist in the retrieved documents.
- **q22** added a clinically important note on variants of uncertain significance
  that no retrieved source supports.
- **q23** presented a detailed pCR definition and an MRI-vs-mammography comparison
  as evidence-backed when the sources contain neither.

A 24/24 that cannot fail is worth less than a 20/24 that names what broke.
Fixing these means constraining the researcher prompt, not tuning the judge.

### What this eval caught in its own tooling

The pipeline has now earned its keep three times, every time against code in this repo:

1. **A regression in the agent.** The first smoke run caught the safety reviewer
   collapsing an approved draft into a one-line "Reviewed" note (judge 1/1/1).
   One instruction fix restored it.
2. **Three defects in the measurement layer**, found when the published numbers
   were audited rather than trusted:
   - `sorted[int(n * 0.95)]` returns the **maximum** for any n below ~20, so an
     earlier "p95" was the slowest sample relabelled. Now linear interpolation,
     and percentiles are withheld entirely below `MIN_SAMPLES_FOR_P95`.
   - `cost_usd` returned `0.0` for any model missing from the price table, and
     the embedding model was missing — so retrieval cost silently vanished from
     every cost figure. Unpriced models now raise; embeddings are metered.
   - The corpus held fewer chunks than retrieval asked for, so the retriever
     returned everything, could not fail, and any groundedness score on top of it
     was unfalsifiable. The corpus is now 184 chunks across 39 documents —
     including six deliberate distractors from adjacent oncology.
3. **The judge itself was not grading grounding.** `JUDGE_PROMPT` received the
   question and the answer but never the retrieved evidence, so "groundedness"
   was a plausibility score. It now receives the source documents, and the score
   moved from a flat 5.0 to 4.42 with four named failures.

An evaluation you never attack is a decoration. These were found by attacking it.

## Repository layout

```
medrag_agent/          ADK agent package (adk web discovers root_agent here)
├── agent.py           researcher → safety-reviewer SequentialAgent
├── retrieval.py       Vertex AI embeddings + Chroma, search tools
├── telemetry.py       latency / tokens-per-sec / cost accounting
└── config.py          models, chunking, pricing
ingest.py              document → chunks → embeddings → index
eval/
├── evalset.jsonl      questions + rubric + gold sources + distractor traps
└── run_eval.py        agent runner + retrieval scoring + LLM judge + report
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
