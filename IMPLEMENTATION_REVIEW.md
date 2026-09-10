# Implementation review — 2026-09-10

Status: implemented and validated locally. Remote publication requires explicit confirmation after automatic approval review rejected a bundled push to other repositories. No retry or alternate publication route was used.

Latest editorial revision: removed promotional headings and home project summaries in favor of names, project numbers and dates. Archive is now “다른 작업들” / “Other work.” The guide starts with its speech bubble closed, with no automatic re-opening. Restored 22 career, research, education, teaching and activity entries from the earlier timeline in bilingual History pages, linked from the home, navigation and PDF. Checked 14 page/viewport combinations and guide interactions; the shared build now produces 18 files and checks 17 HTML pages. These details supersede the earlier layout counts below.

Revised PDFs: five variants regenerated, still seven pages each. All 35 pages rendered and inspected; 24 absolute link annotations per PDF, including the new History link. The cover now lists only identity, project names, numbers and periods. The earlier 23-link count below describes the previous export.

## Portfolio

- Direct hiring-oriented home, four independent bilingual case studies, searchable 20-project archive, Creative, retained OS/emulator routes.
- Shared Korean/English content drives static HTML and PDF. Build and link checks require only Node's standard library.
- Existing Higgsfield character gains locally authored Idle and Point clips alongside the preserved GreetingLoop. Mobile guide collapses while reading; motion preferences and still-image fallback work.
- Anatomy uses actual full-body and exploded-system captures and links to the live app.
- GPU descriptions distinguish the initial local MED-RAG RTX 5090 run, recorded QLoRA RTX 4090 training, and current meeting-assistant RTX 4090 operation.
- Unverified or misleading claims are scoped: 8/37 abstention labels, small synthetic evaluation sets, historical diarization-only timing, offline routing cost simulation.

Validation:

- `node scripts/build-portfolio.cjs`: 16 generated files.
- `node scripts/check-portfolio.cjs`: 15 HTML pages, 467 local references, fragments, structured data, bilingual field completeness.
- Chromium at 390px and 1440px: 28 page/viewport checks; no horizontal overflow, page errors or missing required images.
- Interactive checks: all three character clips, pause/reduced motion, mobile collapse/reopen/Escape, whole/exploded Anatomy, 24/24 versus 20/24 evaluation, archive filters/search/empty state, language plus query/fragment preservation.
- Legacy `index.html#phone`, direct Playground, and failed-3D still-image fallback verified.
- Five PDFs: KO/EN general, KO Toss, KO Motif, EN Cohere. Seven A4 pages each; all 35 pages rendered and visually inspected. Each includes four screenshots and 23 absolute link annotations. Annotation validation does not establish availability of source paths awaiting publication.
- PDF dialog, language/focus, nested case path, Ctrl+P, title/button restoration and optional 20-project/11-page archive checked.

Browser QA scripts/captures and generated PDFs are in ignored `tmp/` and `output/` directories. The portable static check is committed in `scripts/`; GitHub Actions configuration is prepared but has not run remotely.

## MED-RAG Serving Lab

`med-rag-serving/`: pinned manifest/runtime, synthetic quality gates, bounded SSE benchmark client, local gateway, Compose, observability configuration, immutable release preparation and manual rollback instructions.

Python 3.12.14: 25 CPU tests pass. Good fixture passes and deliberately defective candidate is blocked. Compose variables and command configuration are checked. Credentials, local artifacts and environment files are excluded.

Not yet measured: actual GPU compatibility/inference, serving performance, independent model quality, live Prometheus alerts, deployment replacement or recovery time. CPU fixtures cannot authorize a live deployment. The active meeting service was not modified, restarted or stress-tested.

## Other GitHub repositories prepared locally

| Repository | Local commit | Change |
|---|---|---|
| `hyunaeee/hyunaeee` | `302553372797ff41bef96335c405f681c909817a` | Profile identity, case links, GPU history and evidence scope |
| `hyunaeee/CTR-CVR` | `f9a5207824cbc3d0814e6cf7a38581b86a760b23` | README aligned with existing code and reproducibility limits |
| `hyunaeee/terracotta` | `33ef27bba9a660245e7cd4ef021cf7c8025ae997` | CI quality prerequisite, runtime restore/encryption/fallback/healthcheck tests, backup instructions |

Terracotta: local build + 14 tests pass; lint has no errors and seven existing image warnings. Node 24 was tested locally; configured Node 22 CI, Docker runtime and a new image publication remain unverified. Local D1 restore and simulated HTTP 504 tests do not establish production restore or long provider deadline behavior.

Checkouts and PR description are in ignored `tmp/repo-maintenance/`. No remote commits, PR, merge, new Actions run or manual deployment were performed. After explicit publication approval: reconcile upstream, publish docs/site and Terracotta review branch, verify remote checks, and merge Terracotta only after its quality check succeeds.
