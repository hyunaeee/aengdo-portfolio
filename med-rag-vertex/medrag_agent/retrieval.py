"""Retrieval layer: Vertex AI embeddings + Chroma vector store.

Ports the shipped system's two-tier retrieval — past clinical cases first,
official guidelines as fallback — including its recency preference.
The vector store stays local (Chroma) so the demo runs anywhere; swapping in
Vertex AI Vector Search only changes this module.

Two corrections over the first version, both of which quietly inflated the
evaluation numbers:

* Embedding calls were invisible to cost accounting. They now record metrics
  like every other model call, so "cost per request" includes retrieval.
* Guideline hits were sorted purely by recency after retrieval, which threw
  away the similarity ranking entirely — with a small corpus that meant the
  newest guideline won regardless of relevance. Recency is now a bounded
  bonus applied on top of similarity.
"""

import math
from datetime import datetime, timezone

import chromadb
from google import genai
from google.genai.types import EmbedContentConfig

from . import config
from .telemetry import GLOBAL, RequestMetrics

_client: genai.Client | None = None
_collection = None


def genai_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client()  # Vertex AI mode via GOOGLE_GENAI_USE_VERTEXAI=TRUE
    return _client


def collection():
    global _collection
    if _collection is None:
        store = chromadb.PersistentClient(path=str(config.INDEX_DIR))
        _collection = store.get_or_create_collection(
            config.COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
        )
    return _collection


def embed(texts: list[str], *, for_query: bool = False) -> list[list[float]]:
    import time

    t0 = time.perf_counter()
    resp = genai_client().models.embed_content(
        model=config.EMBEDDING_MODEL,
        contents=texts,
        config=EmbedContentConfig(
            task_type="RETRIEVAL_QUERY" if for_query else "RETRIEVAL_DOCUMENT",
            output_dimensionality=config.EMBEDDING_DIM,
        ),
    )
    latency = time.perf_counter() - t0

    # The API reports billable characters; convert to tokens for the per-token
    # price. See config.EMBED_CHARS_PER_TOKEN for why this over-estimates.
    chars = getattr(getattr(resp, "metadata", None), "billable_character_count", 0) or 0
    GLOBAL.record(
        RequestMetrics(
            label="embed:query" if for_query else "embed:doc",
            model=config.EMBEDDING_MODEL,
            latency_s=latency,
            input_tokens=math.ceil(chars / config.EMBED_CHARS_PER_TOKEN),
            output_tokens=0,
            kind="embed",
        )
    )
    return [e.values for e in resp.embeddings]


def _recency(meta: dict) -> float:
    """Age-decayed recency in [0, 1]: 1.0 today, ~0.5 at two years old."""
    date = meta.get("date")
    if not date:
        return 0.0
    try:
        d = datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
    except ValueError:
        return 0.0
    years = (datetime.now(timezone.utc) - d).days / 365.25
    return 0.5 ** max(years, 0.0) / 0.5**0  # 1.0 at age 0, halving each ~1 year


def _search(query: str, k: int, source: str, prefer_recent: bool = False) -> list[dict]:
    qvec = embed([query], for_query=True)[0]
    res = collection().query(
        query_embeddings=[qvec],
        n_results=k * config.CANDIDATE_MULTIPLIER,
        where={"source": source},
        include=["documents", "metadatas", "distances"],
    )
    hits = [
        {"text": doc, "meta": meta, "distance": dist, "similarity": 1.0 - dist}
        for doc, meta, dist in zip(
            res["documents"][0], res["metadatas"][0], res["distances"][0]
        )
    ]
    if prefer_recent:
        # Similarity leads; recency is a bounded bonus that only reorders
        # near-ties. It can no longer promote an irrelevant newer document.
        hits.sort(
            key=lambda h: h["similarity"] + config.RECENCY_WEIGHT * _recency(h["meta"]),
            reverse=True,
        )
    return hits[:k]


def _format(hits: list[dict]) -> str:
    if not hits:
        return "No similar records found."
    blocks = []
    for i, h in enumerate(hits, 1):
        src = h["meta"].get("source_path", "unknown")
        date = h["meta"].get("date") or "n/a"
        blocks.append(f"[{i}] source={src} date={date}\n{h['text']}")
    return "\n\n".join(blocks)


# Last retrieval's source filenames, so an evaluation can measure whether the
# right documents were actually retrieved rather than trusting the answer text.
LAST_SOURCES: list[str] = []


def _track(hits: list[dict]) -> list[dict]:
    for h in hits:
        src = h["meta"].get("source_path")
        if src and src not in LAST_SOURCES:
            LAST_SOURCES.append(src)
    return hits


# --- ADK tools ---------------------------------------------------------------

def search_cases(query: str) -> str:
    """Search past anonymized clinical case records semantically similar to the query.

    Args:
        query: Symptoms and situation of the current case, e.g.
               "62F palpable breast lump, mild pain, no discharge".

    Returns:
        Numbered excerpts of the most similar past cases with their sources.
    """
    return _format(_track(_search(query, config.K_CASES, source="case")))


def search_guidelines(query: str) -> str:
    """Search clinical guidelines, preferring newer ones among equally relevant hits.

    Args:
        query: The clinical question to look up in guideline documents.

    Returns:
        Numbered guideline excerpts with source and publication date.
    """
    return _format(
        _track(_search(query, config.K_GUIDELINES, source="guideline", prefer_recent=True))
    )
