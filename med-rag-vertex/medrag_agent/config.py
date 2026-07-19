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
K_CASES = 6
K_GUIDELINES = 4

# --- cost accounting ---------------------------------------------------------
# USD per 1M tokens. Update alongside https://cloud.google.com/vertex-ai/generative-ai/pricing
PRICING = {
    "gemini-2.5-flash": {"input": 0.30, "output": 2.50},
    "gemini-2.5-pro": {"input": 1.25, "output": 10.00},
}
