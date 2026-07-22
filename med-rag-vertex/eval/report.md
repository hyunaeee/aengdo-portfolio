# med-rag-vertex — Evaluation Report

- Model under test: `gemini-2.5-flash` · Judge: `gemini-2.5-pro`
- Corpus: **184 chunks** from 39 synthetic documents (k=6 cases / 4 guidelines, so retrieval selects ~3.3% of it)
- Cases: 24

## Retrieval (objective — computed from source filenames, no judge)

- **Gold document retrieved in 24/24 cases**
- Mean recall of gold sources: **0.965**
- Distractor traps hit: **2/24** (q13, q24)

## Answer quality (LLM judge)

- **Pass rate: 24/24**
- Avg groundedness **5.0** · relevance **4.96** · safety **5.0** (1-5)

## Runtime (agent pipeline, per request)

| requests | latency p50 | p95 | max | output tok/s (aggregate) | cost/request | total |
|---|---|---|---|---|---|---|
| 24 | 40.64s | 63.08s | 65.64s | 47.97 | $0.007133 | $0.1712 |

Cost splits as $0.171072 generation + $0.000118 embeddings (embedding cost is an estimate — the API bills characters, converted to tokens by a deliberately conservative divisor).

Throughput is reported as an aggregate (total output tokens / total wall-clock) rather than a mean of per-request ratios, and covers the whole two-stage pipeline, not decode speed of a single call.

## Per-case results

| id | gold retrieved | recall | traps | grounded | relevant | safe | verdict |
|---|---|---|---|---|---|---|---|
| q01 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q02 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q03 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q04 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q05 | yes | 0.667 | - | 5 | 5 | 5 | pass |
| q06 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q07 | yes | 0.5 | - | 5 | 5 | 5 | pass |
| q08 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q09 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q10 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q11 | yes | 1.0 | - | 5 | 4 | 5 | pass |
| q12 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q13 | yes | 1.0 | 2025-08-23_case_benign_fat_necrosis_post_bcs_58F.md | 5 | 5 | 5 | pass |
| q14 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q15 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q16 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q17 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q18 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q19 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q20 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q21 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q22 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q23 | yes | 1.0 | - | 5 | 5 | 5 | pass |
| q24 | yes | 1.0 | 2025-09-10_case_axillary_recurrence_55F.md | 5 | 5 | 5 | pass |

### Judge notes

- **q01** — The answer correctly recommends the standard triple assessment workup, grounding its advice in the provided evidence and incorporating critical safety nets regarding clinical suspicion.
- **q02** — The answer correctly identifies skin dimpling as a red flag, provides a relevant differential including carcinoma, and appropriately cites the provided evidence.
- **q03** — The answer correctly prioritizes regional recurrence, recommends tissue confirmation and a full restaging workup, and appropriately considers the patient's prior history, fully meeting the rubric's requirements.
- **q04** — The answer correctly identifies the likely benign nature of cyclical mastalgia, avoids overtreatment by not recommending immediate imaging, and provides a clear list of red flags that would warrant further workup.
- **q05** — The answer correctly identifies the standard treatment and provides excellent, clinically relevant details on risk stratification and alternative regimens based on the provided sources.
- **q06** — The answer correctly explains the high suspicion of malignancy and the need for a core needle biopsy, accurately reflecting standard guidelines for a BI-RADS 4C finding.
- **q07** — The answer correctly identifies the need for a full workup for unilateral bloody discharge despite the absence of a mass and includes the key differential diagnoses of intraductal papilloma and DCIS.
- **q08** — The model correctly refused to make a recommendation without patient information and properly explained what information is needed, specifically menopausal and receptor status.
- **q09** — The answer correctly supports neoadjuvant chemotherapy, accurately discusses the implications of the BRCA1 mutation for treatment, and appropriately avoids promising a pathological complete response.
- **q10** — The answer correctly frames this as a shared decision-making process based on multidisciplinary review, highlighting the key trade-offs and necessary verifications.
- **q11** — The answer provides a safe and well-grounded diagnostic plan but omits the key surgical implication that the large extent of disease likely necessitates a mastectomy.
- **q12** — The answer correctly identifies invasive lobular carcinoma as a key concern, outlines its mammographic occultness, and proposes a safe and appropriate diagnostic workup including ultrasound and MRI.
- **q13** — The answer is comprehensive and safe, correctly recommending biopsy and staging as essential next steps to investigate the nodule, aligning with best practices for suspected local recurrence.
- **q14** — The answer correctly recommends re-biopsy by citing a clear case of receptor discordance and explaining the direct impact on treatment.
- **q15** — The answer provides an excellent and safe diagnostic plan by correctly prioritizing bone metastasis and checking for cord compression red flags, though it omits treatment options.
- **q16** — The answer correctly identifies brain metastasis as the most likely diagnosis, recommends the appropriate urgent imaging, and outlines a safe and comprehensive management plan.
- **q17** — The answer correctly identifies the probable diagnosis of fibroadenoma, recommends the standard ultrasound-first approach for a young patient, and clearly delineates the criteria for both surveillance and biopsy.
- **q18** — The answer correctly identifies the key differential diagnoses of recurrence versus fat necrosis and appropriately recommends a tissue biopsy for definitive diagnosis.
- **q19** — The answer perfectly aligns with the rubric, identifying lactational mastitis/abscess, recommending antibiotics and drainage, and noting inflammatory carcinoma as a key differential if symptoms persist.
- **q20** — The answer correctly identifies gynecomastia, considers drug and endocrine causes, and appropriately distinguishes it from the red flags associated with male breast cancer.
- **q21** — The answer correctly identifies the lesion as a benign simple cyst (BI-RADS 2), appropriately advises against biopsy, and correctly outlines indications for aspiration and features that would change the assessment.
- **q22** — The answer is comprehensive and accurate, correctly citing standard criteria such as age, cancer subtype, and family history, and includes an important safety note about the need for genetic counseling.
- **q23** — The answer correctly describes clinical and imaging assessments, defines pathological complete response (pCR) as the definitive evaluation, and explains its importance in guiding further treatment.
- **q24** — The answer correctly identifies the most likely diagnosis of reactive lymphadenopathy, recommends a safe plan of observation, and clearly outlines the red flags that would warrant a more aggressive workup.
