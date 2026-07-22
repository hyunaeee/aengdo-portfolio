"""LLM-native metrics: latency, tokens/sec, cost-per-request.

Every model call in this project — generation AND embedding — funnels through
`record()`, so the eval pipeline and the live agent report the same numbers the
same way.

Two things here were wrong in the first version and are worth calling out,
because both are easy to get wrong quietly:

1. Percentiles.  `sorted[int(n * 0.95)]` returns the MAXIMUM for any n below
   about 20 — it silently relabels the worst sample as "p95". This now uses
   linear interpolation and refuses to report a percentile it cannot support
   at the sample size actually collected.
2. Unpriced models.  Returning 0.0 for a model missing from the price table
   makes cost accounting fail open: the number looks fine and is simply
   missing a component. Unpriced models now raise.
"""

import json
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path

from . import config

# A percentile estimated from fewer samples than this is not reported; the
# observed maximum is reported instead, under a name that says so.
MIN_SAMPLES_FOR_P95 = 20


class UnpricedModelError(RuntimeError):
    """Raised when a model has no entry in config.PRICING.

    Deliberately fatal: a silent zero here understates every cost number
    downstream, which is worse than a crash because it still looks plausible.
    """


def percentile(values: list[float], q: float) -> float:
    """Linear-interpolation percentile over unsorted `values` (numpy convention)."""
    if not values:
        return 0.0
    s = sorted(values)
    if len(s) == 1:
        return s[0]
    pos = (len(s) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (pos - lo)


@dataclass
class RequestMetrics:
    label: str
    model: str
    latency_s: float
    input_tokens: int
    output_tokens: int
    kind: str = "generate"  # "generate" | "embed"

    @property
    def tokens_per_sec(self) -> float:
        """Output tokens per second of wall-clock for THIS call.

        Only meaningful for a single generation call. The agent pipeline runs
        two sequential generations, so its end-to-end figure is reported
        separately and labelled as a pipeline-level rate, not a decode rate.
        """
        return self.output_tokens / self.latency_s if self.latency_s > 0 else 0.0

    @property
    def cost_usd(self) -> float:
        price = config.PRICING.get(self.model)
        if price is None:
            raise UnpricedModelError(
                f"no price for model {self.model!r}; add it to config.PRICING "
                f"(cost accounting must not silently omit a component)"
            )
        return (
            self.input_tokens * price["input"] + self.output_tokens * price["output"]
        ) / 1_000_000

    def as_dict(self) -> dict:
        d = asdict(self)
        d["tokens_per_sec"] = round(self.tokens_per_sec, 2)
        d["cost_usd"] = round(self.cost_usd, 8)
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

    def of_kind(self, kind: str) -> list[RequestMetrics]:
        return [r for r in self.records if r.kind == kind]

    def summary(self) -> dict:
        """Latency/throughput/cost over the generation calls in this log.

        Embedding calls are excluded from the latency and throughput figures
        (they are not comparable) but ARE included in cost, since retrieval
        cost is part of what a request actually costs.
        """
        gens = self.of_kind("generate")
        if not gens:
            return {}
        lat = [r.latency_s for r in gens]
        n = len(lat)

        out: dict = {
            "requests": n,
            "latency_p50_s": round(percentile(lat, 0.50), 2),
            "latency_min_s": round(min(lat), 2),
            "latency_max_s": round(max(lat), 2),
        }
        if n >= MIN_SAMPLES_FOR_P95:
            out["latency_p95_s"] = round(percentile(lat, 0.95), 2)
        else:
            # Saying "p95" off 8 samples is a fabricated statistic. Say so.
            out["latency_p95_s"] = None
            out["latency_p95_note"] = (
                f"not reported: {n} samples < {MIN_SAMPLES_FOR_P95} required"
            )

        rates = [r.tokens_per_sec for r in gens]
        out["pipeline_output_tokens_per_sec_mean"] = round(sum(rates) / n, 2)
        out["pipeline_output_tokens_per_sec_p50"] = round(percentile(rates, 0.50), 2)
        # Aggregate rate: total output tokens / total wall-clock. Unlike a
        # mean-of-ratios this is not skewed by short fast calls.
        total_out = sum(r.output_tokens for r in gens)
        out["aggregate_output_tokens_per_sec"] = round(total_out / sum(lat), 2) if sum(lat) else 0.0

        gen_cost = sum(r.cost_usd for r in gens)
        emb_cost = sum(r.cost_usd for r in self.of_kind("embed"))
        out["generation_cost_usd"] = round(gen_cost, 6)
        out["embedding_cost_usd"] = round(emb_cost, 6)
        out["avg_cost_per_request_usd"] = round((gen_cost + emb_cost) / n, 6)
        out["total_cost_usd"] = round(gen_cost + emb_cost, 4)
        return out


# Shared log so retrieval-time embedding calls land in the same accounting as
# the generation calls made through the agent.
GLOBAL = MetricsLog()


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
        kind="generate",
    )
    if log:
        log.record(m)
    return resp, m
