"""Compare base vs tuned on held-out cases, with the SAME judge design as
med-rag-vertex: the judge is shown the retrieved context, so groundedness is
graded against evidence rather than plausibility.

Two scores per answer, and they measure different things:

  hallucination  — objective, no model involved. Any bracketed [citation] must
                   name a file that is actually in the context, and any quoted
                   span must actually appear in it. This is the failure mode the
                   whole tune targets, so it is checked mechanically.
  judge          — Gemini 2.5 Pro, given the context: grounding / helpfulness,
                   plus whether an abstain case correctly abstained.

    python evaluate.py                 # both models
    python evaluate.py --only base     # one model
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

import torch
from dotenv import load_dotenv
from google import genai
from google.genai import types
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

ROOT = Path(__file__).resolve().parent
CORPUS = ROOT.parent / "med-rag-vertex"
OUT = ROOT / "out"
JUDGE_MODEL = "gemini-2.5-pro"

JUDGE_PROMPT = """You are grading a clinical decision-support answer that was required to
use ONLY the provided context.

CONTEXT GIVEN TO THE MODEL:
{context}

QUESTION:
{question}

REFERENCE ANSWER (what a correct response looks like; the model did not see this):
{reference}

ANSWER UNDER TEST:
{answer}

Score 1-5 each:
- grounding: is every clinical claim supported by the CONTEXT? Deduct hard for any
  statistic, quotation, threshold or study finding not present in the context.
- helpfulness: does it actually help the clinician with the question asked?
- abstention: if the context does NOT support an answer, did it say so plainly
  instead of answering from general knowledge? If the context DOES support the
  answer, score 5 unless it refused unnecessarily.

Return ONLY: {{"grounding": n, "helpfulness": n, "abstention": n, "note": "<one sentence>"}}"""


def load_held() -> list[dict]:
    p = ROOT / "data" / "eval_held_out.jsonl"
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]


def hallucination_check(answer: str, context: str) -> dict:
    """Objective. Citations must name real files; quotes must exist in context."""
    files = set(re.findall(r"--- ([^\n]+?) ---", context))
    cited = set(re.findall(r"\[([A-Za-z0-9_\-.]+\.md)\]", answer))
    bad_cites = sorted(cited - files)
    bad_quotes = [q for q in re.findall(r'"([^"]{12,})"', answer) if q not in context]
    return {
        "bad_citations": bad_cites,
        "fabricated_quotes": bad_quotes[:3],
        "clean": not bad_cites and not bad_quotes,
    }


def generate(model, tok, msgs, max_new: int = 420) -> str:
    prompt = tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    ids = tok(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        out = model.generate(
            **ids, max_new_tokens=max_new, do_sample=False,
            temperature=None, top_p=None, top_k=None,
            pad_token_id=tok.pad_token_id or tok.eos_token_id,
        )
    return tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()


def load_model(base: str, adapter: Path | None):
    tok = AutoTokenizer.from_pretrained(base, trust_remote_code=True)
    tok.pad_token = tok.pad_token or tok.eos_token
    m = AutoModelForCausalLM.from_pretrained(
        base,
        quantization_config=BitsAndBytesConfig(
            load_in_4bit=True, bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16, bnb_4bit_use_double_quant=True),
        dtype=torch.bfloat16, device_map={"": 0}, trust_remote_code=True,
    )
    if adapter:
        from peft import PeftModel
        m = PeftModel.from_pretrained(m, adapter)
    m.eval()
    return m, tok


def run(tag: str, base: str, adapter: Path | None, rows: list[dict], client) -> list[dict]:
    print(f"\n=== {tag} ===")
    model, tok = load_model(base, adapter)
    results = []
    for i, r in enumerate(rows, 1):
        msgs = r["messages"]
        user = msgs[1]["content"]
        context = user.split("\n\nQUESTION:")[0].replace("CONTEXT:\n", "")
        question = user.split("QUESTION: ")[-1]
        reference = msgs[2]["content"]

        t0 = time.perf_counter()
        answer = generate(model, tok, msgs[:2])
        sec = time.perf_counter() - t0

        hall = hallucination_check(answer, context)
        try:
            jr = client.models.generate_content(
                model=JUDGE_MODEL,
                contents=JUDGE_PROMPT.format(context=context[:9000], question=question,
                                             reference=reference, answer=answer),
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            judge = json.loads(jr.text)
        except Exception as e:
            judge = {"grounding": 0, "helpfulness": 0, "abstention": 0,
                     "note": f"judge error: {type(e).__name__}"}

        results.append({"type": r["type"], "sec": round(sec, 2), "answer": answer,
                        **{f"h_{k}": v for k, v in hall.items()}, **judge})
        flag = "" if hall["clean"] else "  HALLUCINATION"
        print(f"  [{i}/{len(rows)}] {r['type']:8s} g{judge['grounding']} "
              f"h{judge['helpfulness']} a{judge['abstention']} {sec:.1f}s{flag}")

    del model
    torch.cuda.empty_cache()
    return results


def summarize(tag: str, rows: list[dict]) -> dict:
    n = len(rows)
    avg = lambda k: round(sum(r[k] for r in rows) / n, 2)
    return {
        "model": tag,
        "n": n,
        "clean_answers": f"{sum(1 for r in rows if r['h_clean'])}/{n}",
        "fabricated_quotes": sum(len(r["h_fabricated_quotes"]) for r in rows),
        "bad_citations": sum(len(r["h_bad_citations"]) for r in rows),
        "grounding": avg("grounding"),
        "helpfulness": avg("helpfulness"),
        "abstention": avg("abstention"),
        "sec_per_answer": avg("sec"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["base", "v1", "v2"])
    args = ap.parse_args()

    load_dotenv(CORPUS / ".env")
    client = genai.Client()
    rows = load_held()
    meta = json.loads((OUT / "train_meta.json").read_text(encoding="utf-8"))
    base = meta["base"]
    print(f"held-out cases: {len(rows)} · base: {base}")

    candidates = [("base", None), ("v1", OUT / "adapter-v1"), ("v2", OUT / "adapter")]
    out: dict[str, list[dict]] = {}
    for tag, adapter in candidates:
        if args.only and args.only != tag:
            continue
        if adapter is not None and not adapter.exists():
            print(f"({tag}: adapter 없음, 건너뜀)")
            continue
        out[tag] = run(tag.upper(), base, adapter, rows, client)

    summaries = [summarize(k, v) for k, v in out.items()]
    (OUT / "eval_results.json").write_text(
        json.dumps({"summaries": summaries, "detail": out}, ensure_ascii=False, indent=2),
        encoding="utf-8")

    print("\n" + "=" * 64)
    for s in summaries:
        print(json.dumps(s, ensure_ascii=False))
    print(f"\n→ {OUT / 'eval_results.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
