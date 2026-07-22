"""Central configuration for the med-rag Vertex AI port.

Authentication follows the standard Vertex AI environment contract:

    GOOGLE_CLOUD_PROJECT=<your-project-id>
    GOOGLE_CLOUD_LOCATION=us-central1
    GOOGLE_GENAI_USE_VERTEXAI=TRUE

plus `gcloud auth application-default login` on the machine running the demo.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# --- documents & index -------------------------------------------------------
CASES_DIR = BASE_DIR / "docs_cases"
GUIDES_DIR = BASE_DIR / "docs_guides"
INDEX_DIR = BASE_DIR / "index"
COLLECTION_NAME = "med_rag_vertex"

# --- models ------------------------------------------------------------------
# gemini-embedding-001 on Vertex AI; 768 dims keeps the local Chroma index small.
EMBEDDING_MODEL = os.getenv("MEDRAG_EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIM = 768
GENERATION_MODEL = os.getenv("MEDRAG_GENERATION_MODEL", "gemini-2.5-flash")
JUDGE_MODEL = os.getenv("MEDRAG_JUDGE_MODEL", "gemini-2.5-pro")

# --- chunking (kept identical to the shipped on-prem system) -----------------
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100

# --- retrieval ---------------------------------------------------------------
# These must stay well below the number of indexed chunks. If k approaches the
# corpus size the retriever returns nearly everything, cannot fail, and any
# groundedness score measured on top of it is unfalsifiable.
K_CASES = 6
K_GUIDELINES = 4
# Candidates pulled by similarity before re-ranking. Kept at a fixed multiple of
# k so re-ranking reorders a genuine shortlist rather than the whole corpus.
CANDIDATE_MULTIPLIER = 3

# --- cost accounting ---------------------------------------------------------
# USD per 1M tokens, verified against
# https://cloud.google.com/vertex-ai/generative-ai/pricing (checked 2026-07-22).
# Every model this project calls must appear here: telemetry raises on an
# unpriced model rather than silently costing it at zero.
PRICING = {
    "gemini-2.5-flash": {"input": 0.30, "output": 2.50},
    "gemini-2.5-pro": {"input": 1.25, "output": 10.00},
    # Embeddings bill on input only; output priced at 0 so the same formula applies.
    "gemini-embedding-001": {"input": 0.15, "output": 0.0},
}

# The embedding API reports `billable_character_count`, not tokens, so pricing
# per token needs a conversion. Mixed Korean/English clinical text tokenizes
# denser than plain English; this divisor is deliberately low, which
# OVER-estimates tokens and therefore over-estimates cost. Embedding cost is
# labelled an estimate wherever it is reported.
EMBED_CHARS_PER_TOKEN = 2.5

# Weight of the recency bonus when re-ranking guideline hits. Similarity stays
# the primary signal (cosine similarity is in [0, 1]); recency only reorders
# near-ties, so a newer-but-irrelevant guideline cannot displace a relevant one.
RECENCY_WEIGHT = 0.05
