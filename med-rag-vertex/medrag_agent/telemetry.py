"""LLM-native metrics: latency, tokens/sec, cost-per-request.

Every generation in this project funnels through `record()`, so the eval
pipeline and the live agent report the same numbers the same way.
"""

import json
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path

from . import config


@dataclass
class RequestMetrics:
    label: str
    model: str
    latency_s: float
    input_tokens: int
    output_tokens: int

    @property
    def tokens_per_sec(self) -> float:
        return self.output_tokens / self.latency_s if self.latency_s > 0 else 0.0

    @property
    def cost_usd(self) -> float:
        price = config.PRICING.get(self.model)
        if not price:
            return 0.0
        return (
            self.input_tokens * price["input"] + self.output_tokens * price["output"]
        ) / 1_000_000

    def as_dict(self) -> dict:
        d = asdict(self)
        d["tokens_per_sec"] = round(self.tokens_per_sec, 2)
        d["cost_usd"] = round(self.cost_usd, 6)
        return d


@dataclass
class MetricsLog:
    """Accumulates per-request metrics; optionally persists as JSONL."""

    path: Path | None = None
    records: list[RequestMetrics] = field(default_factory=list)

    def record(self, m: RequestMetrics) -> RequestMetrics:
        self.records.append(m)
        if self.path:
            with open(self.path, "a", encoding="utf-8") as f:
                f.write(json.dumps(m.as_dict(), ensure_ascii=False) + "\n")
        return m

    def summary(self) -> dict:
        if not self.records:
            return {}
        lat = sorted(r.latency_s for r in self.records)
        n = len(lat)
        return {
            "requests": n,
            "latency_p50_s": round(lat[n // 2], 2),
            "latency_p95_s": round(lat[min(n - 1, int(n * 0.95))], 2),
            "avg_tokens_per_sec": round(sum(r.tokens_per_sec for r in self.records) / n, 2),
            "avg_cost_per_request_usd": round(sum(r.cost_usd for r in self.records) / n, 6),
            "total_cost_usd": round(sum(r.cost_usd for r in self.records), 4),
        }


def timed_generate(client, *, model: str, label: str, log: MetricsLog | None = None, **kwargs):
    """generate_content with latency + usage capture. Returns (response, metrics)."""
    t0 = time.perf_counter()
    resp = client.models.generate_content(model=model, **kwargs)
    latency = time.perf_counter() - t0
    usage = getattr(resp, "usage_metadata", None)
    m = RequestMetrics(
        label=label,
        model=model,
        latency_s=latency,
        input_tokens=getattr(usage, "prompt_token_count", 0) or 0,
        output_tokens=getattr(usage, "candidates_token_count", 0) or 0,
    )
    if log:
        log.record(m)
    return resp, m
