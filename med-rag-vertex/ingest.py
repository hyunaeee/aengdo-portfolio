"""Index clinical documents into Chroma using Vertex AI embeddings.

Usage:
    python ingest.py

Reads PDFs / text / markdown from docs_cases/ (past case records) and
docs_guides/ (official guidelines) — both git-ignored, never committed —
chunks them, embeds with gemini-embedding-001 on Vertex AI, and writes the
vectors to the local Chroma index.
"""

import re
import sys
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader

from medrag_agent import config
from medrag_agent.retrieval import collection, embed

SEPARATORS = ["\n\n", "\n", ". ", " "]


def split_text(text: str, size: int = config.CHUNK_SIZE, overlap: int = config.CHUNK_OVERLAP) -> list[str]:
    """Recursive character splitting — same size/overlap as the shipped system."""

    def _split(t: str, seps: list[str]) -> list[str]:
        if len(t) <= size:
            return [t] if t.strip() else []
        if not seps:
            return [t[i : i + size] for i in range(0, len(t), size - overlap)]
        parts, out, buf = t.split(seps[0]), [], ""
        for part in parts:
            candidate = buf + seps[0] + part if buf else part
            if len(candidate) <= size:
                buf = candidate
            else:
                if buf:
                    out.append(buf)
                out.extend(_split(part, seps[1:]) if len(part) > size else [part])
                buf = out.pop() if out and len(out[-1]) < overlap else ""
        if buf:
            out.append(buf)
        return [c for c in out if c.strip()]

    return _split(text, SEPARATORS)


def read_file(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        return "\n".join(page.extract_text() or "" for page in PdfReader(str(path)).pages)
    if path.suffix.lower() in {".txt", ".md", ".log"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    print(f"  skip unsupported: {path.name}")
    return ""


def guess_date(stem: str) -> str | None:
    m = re.match(r"(\d{4})-?(\d{2})-?(\d{2})", stem)
    if not m:
        return None
    try:
        return datetime(int(m[1]), int(m[2]), int(m[3])).date().isoformat()
    except ValueError:
        return None


def ingest_folder(folder: Path, source_tag: str) -> int:
    if not folder.exists():
        print(f"  {folder.name}/ not found — skipping")
        return 0
    col, total = collection(), 0
    for path in sorted(folder.rglob("*")):
        if not path.is_file():
            continue
        text = read_file(path)
        if not text.strip():
            continue
        chunks = split_text(text)
        meta = {
            "source": source_tag,
            "source_path": path.name,
            "date": guess_date(path.stem) or "",
        }
        for i in range(0, len(chunks), 20):  # embed in small batches
            batch = chunks[i : i + 20]
            col.add(
                ids=[f"{source_tag}:{path.stem}:{i + j}" for j in range(len(batch))],
                embeddings=embed(batch),
                documents=batch,
                metadatas=[meta] * len(batch),
            )
        total += len(chunks)
        print(f"  {path.name}: {len(chunks)} chunks")
    return total


def main() -> int:
    config.INDEX_DIR.mkdir(exist_ok=True)
    print("Indexing cases...")
    n_cases = ingest_folder(config.CASES_DIR, "case")
    print("Indexing guidelines...")
    n_guides = ingest_folder(config.GUIDES_DIR, "guideline")
    print(f"Done: {n_cases} case chunks + {n_guides} guideline chunks -> {config.INDEX_DIR}")
    if n_cases + n_guides == 0:
        print("Put documents into docs_cases/ or docs_guides/ first.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
