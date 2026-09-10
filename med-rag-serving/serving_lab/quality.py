"""Mechanical contract checks, NOT clinical correctness or a semantic judge."""
import re
from .common import digest_object, utc_now

CITATION = re.compile(r"\[([A-Za-z0-9_.-]+\.md)\]")
QUOTES = re.compile(r'["“]([^"”\n]{3,})["”]')
REFUSAL = re.compile(r"(자료에\s*없|자료로는.{0,30}(알|확인|판단|답).{0,12}(없|어렵)|알\s*수\s*없|확인할\s*수\s*없|답할\s*수\s*없|근거가\s*없|cannot\s+(answer|determine)|not\s+(provided|in\s+the\s+context))", re.I)


def normalized(text):
    return " ".join(text.split()).casefold()


def validate_cases(cases):
    ids = [item.get("id") for item in cases]
    if not cases or any(not item for item in ids) or len(ids) != len(set(ids)):
        raise ValueError("Evaluation cases must have unique nonempty IDs")
    for case in cases:
        if not isinstance(case.get("answerable"), bool) or not case.get("question"):
            raise ValueError(f"Invalid case: {case['id']}")
        sources = case.get("context", [])
        source_ids = [item.get("source_id") for item in sources]
        if len(source_ids) != len(set(source_ids)) or any(not item.get("text") for item in sources):
            raise ValueError(f"Invalid source context: {case['id']}")
        if case["answerable"] and (not sources or not case.get("expected_facts")):
            raise ValueError(f"Answerable case needs evidence and expected facts: {case['id']}")


def score_case(case, response):
    answer = response.get("answer", "")
    reasons = []
    if response.get("error"):
        reasons.append("inference_error")
    if not isinstance(answer, str) or not answer.strip():
        return {"id": case["id"], "pass": False, "reasons": reasons + ["missing_answer"], "overrefusal": False}
    cited = CITATION.findall(answer)
    sources = {entry["source_id"]: entry["text"] for entry in case["context"]}
    if any(item not in sources for item in cited):
        reasons.append("unknown_citation")
    if case["answerable"] and not cited:
        reasons.append("missing_citation")
    available_text = normalized(" ".join(sources[item] for item in cited if item in sources))
    if any(normalized(quote) not in available_text for quote in QUOTES.findall(answer)):
        reasons.append("fabricated_quote")
    refused = bool(REFUSAL.search(answer))
    # A mixed answer/refusal is conservatively sent for review, never silently accepted.
    overrefusal = case["answerable"] and refused
    if overrefusal:
        reasons.append("overrefusal")
    if not case["answerable"] and not refused:
        reasons.append("missing_abstention")
    for alternatives in case.get("expected_facts", []):
        if not any(normalized(term) in normalized(answer) for term in alternatives):
            reasons.append("missing_expected_fact")
            break
    return {"id": case["id"], "pass": not reasons, "reasons": reasons, "overrefusal": overrefusal}


def evaluate(cases, responses, manifest_sha, acceptance, evidence_kind):
    validate_cases(cases)
    ids = [row.get("id") for row in responses]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate response IDs")
    expected = {case["id"] for case in cases}
    if set(ids) != expected:
        raise ValueError("Response IDs must match the complete evaluation set")
    for row in responses:
        if row.get("manifest_sha256") != manifest_sha or row.get("evidence_kind") != evidence_kind:
            raise ValueError("Response provenance does not match the candidate manifest and evidence kind")
    if evidence_kind not in ("simulated-cpu", "live-endpoint"):
        raise ValueError("Unknown evidence kind")
    by_id = {row["id"]: row for row in responses}
    results = [score_case(case, by_id[case["id"]]) for case in cases]
    answerable = sum(case["answerable"] for case in cases)
    overrefusals = sum(row["overrefusal"] for row in results)
    ratio = overrefusals / answerable if answerable else 0.0
    other_failures = [row for row in results if any(reason != "overrefusal" for reason in row["reasons"])]
    passed = not other_failures and ratio <= acceptance["max_overrefusal_rate"]
    return {
        "schema_version": 1, "created_at": utc_now(), "kind": "quality-gate",
        "evidence_kind": evidence_kind, "manifest_sha256": manifest_sha,
        "cases_sha256": digest_object(cases), "responses_sha256": digest_object(responses),
        "status": "pass" if passed else "blocked", "case_count": len(cases),
        "answerable_count": answerable, "overrefusal_count": overrefusals,
        "overrefusal_rate": ratio, "failed_cases": sum(not row["pass"] for row in results),
        "scope": "Public synthetic smoke contract; not an independent clinical-quality evaluation or GPU benchmark.",
        "results": results,
    }
