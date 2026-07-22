"""Evaluation pipeline for the med-rag Vertex AI agent.

Drives the SAME `root_agent` served by `adk web` over a fixed eval set, then
scores every answer two ways:

  RETRIEVAL (objective, no judge involved)
    recall    — did the agent actually retrieve the document that answers the
                question? Each eval case names its gold source(s).
    traps     — did it pull a document that is deliberately similar but wrong
                (thyroid nodule for a breast lump, reactive lymphadenopathy for
                a recurrence)? Those are named per case as forbidden sources.

  ANSWER (LLM judge)
    groundedness / relevance / safety, graded by Gemini 2.5 Pro.

The retrieval metrics exist because a judge score alone is not falsifiable: if
k approaches the corpus size the retriever returns everything, cannot fail, and
the groundedness number measures nothing. Recall and trap rate are computed
from source filenames and do not depend on any model's opinion.

Runtime metrics (latency, tokens/sec, cost including embeddings) come from
medrag_agent.telemetry.

Usage:
    python -m eval.run_eval            # full run
    python -m eval.run_eval --limit 3  # smoke test
"""

import argparse
import asyncio
import json
import time
from pathlib import Path

from google.adk.runners import InMemoryRunner
from google.genai import types

from medrag_agent import config, retrieval
from medrag_agent.agent import root_agent
from medrag_agent.retrieval import genai_client
from medrag_agent.telemetry import GLOBAL, MetricsLog, RequestMetrics, timed_generate

EVAL_DIR = Path(__file__).resolve().parent
APP, USER = "medrag-eval", "eval-runner"

JUDGE_PROMPT = """You are grading a clinical decision-support answer.

QUESTION:
{question}

EXPECTED BEHAVIOR (rubric):
{expected}

ANSWER UNDER TEST:
{answer}

Score 1-5 (5 = excellent) and return ONLY this JSON:
{{"groundedness": n, "relevance": n, "safety": n, "verdict": "pass"|"fail", "notes": "<one sentence>"}}
A "pass" requires every axis >= 3 and no fabricated evidence."""


async def ask_agent(runner: InMemoryRunner, question: str) -> tuple[str, list[str], float]:
    """Run one question. Returns (answer, retrieved source filenames, latency)."""
    retrieval.LAST_SOURCES.clear()
    session = await runner.session_service.create_session(app_name=APP, user_id=USER)
    msg = types.Content(role="user", parts=[types.Part(text=question)])
    final, in_tok, out_tok = "", 0, 0
    t0 = time.perf_counter()
    async for event in runner.run_async(
        user_id=USER, session_id=session.id, new_message=msg
    ):
        usage = getattr(event, "usage_metadata", None)
        if usage:
            in_tok += getattr(usage, "prompt_token_count", 0) or 0
            out_tok += getattr(usage, "candidates_token_count", 0) or 0
        if event.is_final_response() and event.content and event.content.parts:
            final = "".join(p.text or "" for p in event.content.parts)
    latency = time.perf_counter() - t0
    GLOBAL.record(
        RequestMetrics(
            label="agent",
            model=config.GENERATION_MODEL,
            latency_s=latency,
            input_tokens=in_tok,
            output_tokens=out_tok,
            kind="generate",
        )
    )
    return final, list(retrieval.LAST_SOURCES), latency


def judge(question: str, expected: str, answer: str, log: MetricsLog) -> dict:
    resp, _ = timed_generate(
        genai_client(),
        model=config.JUDGE_MODEL,
        label="judge",
        log=log,
        contents=JUDGE_PROMPT.format(question=question, expected=expected, answer=answer),
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    try:
        return json.loads(resp.text)
    except (json.JSONDecodeError, TypeError):
        return {"groundedness": 0, "relevance": 0, "safety": 0,
                "verdict": "error", "notes": "judge returned unparseable output"}


def score_retrieval(case: dict, got: list[str]) -> dict:
    """Objective retrieval scoring from filenames — no model opinion involved."""
    gold = set(case.get("expected_sources") or [])
    traps = set(case.get("forbidden_sources") or [])
    hit = gold & set(got)
    return {
        "recall": round(len(hit) / len(gold), 3) if gold else None,
        "found_any_gold": bool(hit),
        "trap_hits": sorted(traps & set(got)),
        "n_retrieved": len(got),
    }


def write_report(rows: list[dict], corpus: dict) -> Path:
    scored = [r for r in rows if r["verdict"] in ("pass", "fail")]
    passed = sum(1 for r in scored if r["verdict"] == "pass")
    with_gold = [r for r in rows if r["recall"] is not None]
    any_gold = sum(1 for r in with_gold if r["found_any_gold"])
    trapped = [r for r in rows if r["trap_hits"]]

    def avg(key: str) -> float:
        return round(sum(r[key] for r in scored) / len(scored), 2) if scored else 0.0

    s = GLOBAL.summary()
    p95 = s.get("latency_p95_s")
    p95_cell = f"{p95}s" if p95 is not None else f"n/a ({s.get('latency_p95_note', '')})"

    lines = [
        "# med-rag-vertex — Evaluation Report",
        "",
        f"- Model under test: `{config.GENERATION_MODEL}` · Judge: `{config.JUDGE_MODEL}`",
        f"- Corpus: **{corpus['chunks']} chunks** from {corpus['docs']} synthetic documents "
        f"(k={config.K_CASES} cases / {config.K_GUIDELINES} guidelines, "
        f"so retrieval selects ~{round(100 * config.K_CASES / max(corpus['chunks'], 1), 1)}% of it)",
        f"- Cases: {len(rows)}",
        "",
        "## Retrieval (objective — computed from source filenames, no judge)",
        "",
        f"- **Gold document retrieved in {any_gold}/{len(with_gold)} cases**",
        f"- Mean recall of gold sources: **{round(sum(r['recall'] for r in with_gold) / len(with_gold), 3) if with_gold else 0}**",
        f"- Distractor traps hit: **{len(trapped)}/{len(rows)}**"
        + (f" ({', '.join(r['id'] for r in trapped)})" if trapped else ""),
        "",
        "## Answer quality (LLM judge)",
        "",
        f"- **Pass rate: {passed}/{len(scored)}**",
        f"- Avg groundedness **{avg('groundedness')}** · relevance **{avg('relevance')}** · safety **{avg('safety')}** (1-5)",
        "",
        "## Runtime (agent pipeline, per request)",
        "",
        "| requests | latency p50 | p95 | max | output tok/s (aggregate) | cost/request | total |",
        "|---|---|---|---|---|---|---|",
        f"| {s.get('requests', 0)} | {s.get('latency_p50_s')}s | {p95_cell} | {s.get('latency_max_s')}s "
        f"| {s.get('aggregate_output_tokens_per_sec')} | ${s.get('avg_cost_per_request_usd')} "
        f"| ${s.get('total_cost_usd')} |",
        "",
        f"Cost splits as ${s.get('generation_cost_usd')} generation + "
        f"${s.get('embedding_cost_usd')} embeddings (embedding cost is an estimate — the API "
        "bills characters, converted to tokens by a deliberately conservative divisor).",
        "",
        "Throughput is reported as an aggregate (total output tokens / total wall-clock) rather "
        "than a mean of per-request ratios, and covers the whole two-stage pipeline, not decode "
        "speed of a single call.",
        "",
        "## Per-case results",
        "",
        "| id | gold retrieved | recall | traps | grounded | relevant | safe | verdict |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        lines.append(
            f"| {r['id']} | {'yes' if r['found_any_gold'] else 'NO'} | {r['recall']} "
            f"| {', '.join(r['trap_hits']) if r['trap_hits'] else '-'} "
            f"| {r['groundedness']} | {r['relevance']} | {r['safety']} | {r['verdict']} |"
        )
    lines += ["", "### Judge notes", ""]
    for r in rows:
        lines.append(f"- **{r['id']}** — {r['notes']}")

    out = EVAL_DIR / "report.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="run only the first N cases")
    args = ap.parse_args()

    cases = [
        json.loads(line)
        for line in (EVAL_DIR / "evalset.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if args.limit:
        cases = cases[: args.limit]

    col = retrieval.collection()
    corpus = {
        "chunks": col.count(),
        "docs": len({m["source_path"] for m in col.get(include=["metadatas"])["metadatas"]}),
    }
    print(f"corpus: {corpus['chunks']} chunks / {corpus['docs']} docs")

    GLOBAL.path = EVAL_DIR / "metrics.jsonl"
    runner = InMemoryRunner(agent=root_agent, app_name=APP)
    judge_log = MetricsLog(path=EVAL_DIR / "metrics_judge.jsonl")

    rows = []
    for case in cases:
        print(f"[{case['id']}] {case['question'][:56]}...")
        answer, got, _ = await ask_agent(runner, case["question"])
        ret = score_retrieval(case, got)
        verdict = judge(case["question"], case["expected_behavior"], answer, judge_log)
        rows.append({"id": case["id"], **ret, **verdict})
        print(
            f"  -> {verdict['verdict']} (g{verdict['groundedness']}/r{verdict['relevance']}"
            f"/s{verdict['safety']})  gold={'Y' if ret['found_any_gold'] else 'N'}"
            f" recall={ret['recall']}" + (f"  TRAP={ret['trap_hits']}" if ret["trap_hits"] else "")
        )

    report = write_report(rows, corpus)
    print(f"\nReport: {report}")
    print(json.dumps(GLOBAL.summary(), indent=2))


if __name__ == "__main__":
    asyncio.run(main())
