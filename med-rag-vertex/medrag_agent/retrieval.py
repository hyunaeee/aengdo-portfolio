"""Retrieval layer: Vertex AI embeddings + Chroma vector store.

Ports the shipped system's two-tier retrieval — past clinical cases first,
official guidelines as fallback — including its recency re-ranking.
The vector store stays local (Chroma) so the demo runs anywhere; swapping in
Vertex AI Vector Search only changes this module.
"""

from datetime import datetime

import chromadb
from google import genai
from google.genai.types import EmbedContentConfig

from . import config

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
    resp = genai_client().models.embed_content(
        model=config.EMBEDDING_MODEL,
        contents=texts,
        config=EmbedContentConfig(
            task_type="RETRIEVAL_QUERY" if for_query else "RETRIEVAL_DOCUMENT",
            output_dimensionality=config.EMBEDDING_DIM,
        ),
    )
    return [e.values for e in resp.embeddings]


def _recency_score(meta: dict) -> float:
    """Newer guidelines outrank older ones (ported from the on-prem system)."""
    date = meta.get("date")
    if not date:
        return 0.0
    try:
        return datetime.fromisoformat(date).timestamp()
    except ValueError:
        return 0.0


def _search(query: str, k: int, source: str, recency: bool = False) -> list[dict]:
    qvec = embed([query], for_query=True)[0]
    res = collection().query(
        query_embeddings=[qvec],
        n_results=max(k * 2, k),
        where={"source": source},
        include=["documents", "metadatas", "distances"],
    )
    hits = [
        {"text": doc, "meta": meta, "distance": dist}
        for doc, meta, dist in zip(
            res["documents"][0], res["metadatas"][0], res["distances"][0]
        )
    ]
    if recency:
        hits.sort(key=lambda h: _recency_score(h["meta"]), reverse=True)
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


# --- ADK tools ---------------------------------------------------------------

def search_cases(query: str) -> str:
    """Search past anonymized clinical case records semantically similar to the query.

    Args:
        query: Symptoms and situation of the current case, e.g.
               "62F palpable breast lump, mild pain, no discharge".

    Returns:
        Numbered excerpts of the most similar past cases with their sources.
    """
    return _format(_search(query, config.K_CASES, source="case"))


def search_guidelines(query: str) -> str:
    """Search official clinical guidelines, newest first.

    Args:
        query: The clinical question to look up in guideline documents.

    Returns:
        Numbered guideline excerpts with source and publication date.
    """
    return _format(_search(query, config.K_GUIDELINES, source="guideline", recency=True))
