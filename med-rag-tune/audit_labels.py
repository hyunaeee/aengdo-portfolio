"""Audit and repair abstain labels in the SFT dataset.

WHY THIS EXISTS (v1 post-mortem)
--------------------------------
The v1 A/B showed the tuned model over-refusing: on several held-out cases it
claimed the context lacked information that was explicitly present. Root cause:
build_dataset.py's verifier checked that an "abstain" answer EXPRESSES
abstention, but never checked that abstention was WARRANTED — i.e. that the
context truly does not answer the question. Generator mislabels slipped
through (confirmed: held-out case 23 asks for the recommended adjuvant therapy
while its context states "Adjuvant anti-PD-1 immunotherapy was recommended").
Training on "refuse even though the answer is right there" teaches exactly the
over-refusal the A/B measured.

WHAT IT DOES
------------
For every abstain-labelled example (train and held-out), asks Gemini — WITH the
context — whether the question is answerable from it:

  not answerable  → label was right, keep as-is
  answerable      → label was wrong. Relabel to "grounded" and replace the
                    reference answer with the context-supported answer
                    (which must pass the same mechanical quote check).

Writes repaired files in place and keeps originals as *.v1 backups.

    python audit_labels.py
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parent
CORPUS = ROOT.parent / "med-rag-vertex"
AUDIT_MODEL = "gemini-2.5-pro"  # the auditor should be stronger than the generator

PROMPT = """CONTEXT:
{context}

QUESTION: {question}

Can this question be answered from the CONTEXT alone?

- If the CONTEXT contains the answer (explicitly or by direct implication), reply:
  {{"answerable": true, "answer": "<the answer, using ONLY facts from the CONTEXT,
   citing the source filename in brackets like [file.md]>"}}
- If it genuinely cannot be answered from the CONTEXT, reply:
  {{"answerable": false, "answer": ""}}

Be strict in BOTH directions: do not call it answerable on a stretch, and do not
call it unanswerable when the fact is plainly there. Return ONLY the JSON."""


def quote_check(answer: str, context: str) -> bool:
    return all(q in context for q in re.findall(r'"([^"]{12,})"', answer))


def audit_file(path: Path, client) -> dict:
    rows = [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
    stats = {"total": len(rows), "abstain": 0, "kept": 0, "relabelled": 0, "dropped": 0}

    for r in rows:
        if r["type"] != "abstain":
            continue
        stats["abstain"] += 1
        user = r["messages"][1]["content"]
        context = user.split("\n\nQUESTION:")[0].replace("CONTEXT:\n", "")
        question = user.split("QUESTION: ")[-1]
        try:
            resp = client.models.generate_content(
                model=AUDIT_MODEL,
                contents=PROMPT.format(context=context[:12000], question=question),
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            verdict = json.loads(resp.text)
        except Exception as e:
            print(f"  audit error ({type(e).__name__}) — keeping label as-is")
            stats["kept"] += 1
            continue

        if not verdict.get("answerable"):
            stats["kept"] += 1
            continue

        fixed = (verdict.get("answer") or "").strip()
        if len(fixed) >= 20 and quote_check(fixed, context):
            r["type"] = "grounded"
            r["messages"][2]["content"] = fixed
            r["_relabelled_from"] = "abstain"
            stats["relabelled"] += 1
            print(f"  RELABELLED → grounded: {question[:70]}")
        else:
            r["_drop"] = True
            stats["dropped"] += 1
            print(f"  DROPPED (answerable but repair failed check): {question[:70]}")

    kept_rows = [r for r in rows if not r.get("_drop")]
    backup = path.with_suffix(path.suffix + ".v1")
    if not backup.exists():
        shutil.copy(path, backup)
    with open(path, "w", encoding="utf-8") as f:
        for r in kept_rows:
            r.pop("_drop", None)
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    stats["after"] = len(kept_rows)
    return stats


def main() -> int:
    load_dotenv(CORPUS / ".env")
    client = genai.Client()
    for name in ("train.jsonl", "eval_held_out.jsonl"):
        p = ROOT / "data" / name
        print(f"\n=== {name} ===")
        print(json.dumps(audit_file(p, client), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
