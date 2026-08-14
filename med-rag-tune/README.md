# med-rag-tune 🔬

**A measured QLoRA fine-tuning experiment against a failure my own evaluation found —
including the iteration where the training data itself turned out to be the bug.**

Companion to [med-rag-vertex](https://github.com/hyunaeee/aengdo-portfolio/tree/main/med-rag-vertex):
that project's evaluation surfaced the failure this project tries to fix, and its
judge design (the judge sees the retrieved evidence) is reused here unchanged.

> **한 줄 요약** — 평가가 잡은 환각(검색은 맞는데 근거에 없는 주장을 지어냄)을 겨냥해
> 7B 모델을 QLoRA로 튜닝했다. 목표 지표(위조 인용 2→0)는 달성했지만 과잉 거부라는
> 대가가 생겼고, 그 원인을 추적하니 **학습 데이터의 22%가 오라벨**이었다. 데이터를
> 수리해 재학습하자 점수가 측정 가능하게 회복됐다(v1→v2). 그래도 base를 넘지는
> 못했다 — 이 규모에서는 프롬프트+게이트가 여전히 낫다는 것까지가 측정 결과다.

---

## 1 · Why

med-rag-vertex's evaluation — once its judge was shown the retrieved documents —
failed 4 of 24 cases, and every failure had the same shape: **retrieval had already
placed the right document in front of the model (gold retrieved 23/24), and the model
still asserted things the documents don't say.** A fabricated BI-RADS statistic. A
quoted "Teaching point" that exists in no source.

That is a *behavioural* failure, not a retrieval failure. Improving retrieval cannot
fix it.

## 2 · Why fine-tuning, specifically

Prompt hardening is cheaper and was tried first — and on a strong instruct model it
almost works (see the result: base is 29/30 clean under the strict grounding prompt).
The reason to measure fine-tuning anyway: **the real deployment is an on-premise
7B–27B model inside a hospital network** where patient data cannot leave and the model
cannot be swapped for a frontier API. Small on-prem models follow prompts less
reliably; weight-level behaviour change is the realistic lever in exactly the
regulated environments that force on-prem in the first place.

## 3 · Setup

| | |
|---|---|
| Base | Qwen/Qwen2.5-7B-Instruct (strong KO+EN), 4-bit NF4 |
| Method | QLoRA — rank 32, all attention+MLP projections, **loss on the assistant turn only** (the model must not memorize the clinical corpus) |
| Data | 154 train / 30 held-out, generated from the med-rag-vertex synthetic corpus in three types: **grounded** (answer with citation), **abstain** (the context does not contain the answer — say so), **partial** |
| Hardware | 1× RTX 4090, ~6–8.5 min per training run |
| Eval | Same held-out for every model. Two independent scorers: **mechanical hallucination check** (cited filenames must exist in context; quoted spans must appear verbatim — no model opinion) and a **Gemini 2.5 Pro judge that sees the context** (grounding · helpfulness · abstention) |

Generated training examples were mechanically verified before use — any answer quoting
text absent from its context was dropped (12 rejected). Hypotheses were written down
before the first run, including the failure mode to watch for: **over-refusal** (H3).

## 4 · Result v1 — the target metric moved, and so did the failure mode

| (held-out 30) | clean | fabricated quotes | grounding | helpfulness |
|---|---|---|---|---|
| base | 29/30 | 2 | 4.80 | 4.63 |
| **tuned v1** | **30/30** | **0** | 4.40 | **4.13** |

The tail was cut exactly as targeted — and H3 landed: v1 **refuses questions whose
answers are explicitly in the context** ("0/3 sentinel nodes negative" is in the
document; v1 says the document doesn't contain it).

## 5 · The A/B told us where to look: the data was the bug

Auditing the training set with a stronger model (Gemini 2.5 Pro, shown the context,
asked "is this actually unanswerable?") found that **8 of 37 abstain examples (22%)
were mislabelled** — the context contained the answer, and the example taught the
model to refuse anyway. The dataset verifier had checked that abstention was
*expressed*, never that abstention was *warranted*. Two of seven held-out abstain
cases had the same defect.

`audit_labels.py` repairs them: answerable cases are relabelled to grounded with a
context-supported answer (which must pass the same mechanical quote check), and v2
was trained on the repaired set. Same recipe, same seeds, same held-out.

## 6 · Result v2 — data repair moved the numbers; base still wins on judge score

| (repaired held-out 30) | clean | fabricated | grounding | helpfulness | abstention |
|---|---|---|---|---|---|
| base | 29/30 | 2 | **4.80** | **4.63** | **4.87** |
| tuned v1 | 30/30 | 0 | 4.40 | 4.13 | 4.47 |
| **tuned v2** | **30/30** | **0** | 4.63 | 4.30 | 4.53 |

- **Repairing 8 of 154 examples produced a measurable model-quality gain**
  (v1→v2: grounding +0.23, helpfulness +0.17, same held-out) — at this scale, data
  quality is the active ingredient, and the causal link is measured, not assumed.
- Both tunes hold the objective win: fabricated quotes 2→0, clean 30/30.
- v2 still over-refuses on 3 of 30 cases, and the judge still prefers base overall.

## 7 · Engineering conclusion

For a strong instruct base under a strict grounding prompt, **prompting already gets
you to 29/30 clean — a 154-example tune buys the last tail (2→0 fabrications) at a
helpfulness cost that label repair halves but does not eliminate.** The production
recommendation for this system today is base + strict prompt + the med-rag-vertex
safety-reviewer gate, not this adapter. The measured v1→v2 delta says what the next
lever is: more *clean* abstain data, since 8 repaired labels moved judge scores by
+0.2 — not more epochs, not a bigger rank.

Caveats, stated rather than hidden: n=30 held-out; judge deltas of 0.2–0.5 on a
5-point scale are directionally consistent with the objective counts but small-sample;
per-answer latency figures include unmerged-adapter overhead.

## Files

```
build_dataset.py   corpus → 3-type SFT set, mechanically verified (12 rejected)
audit_labels.py    the v1 post-mortem tool: finds & repairs unwarranted-abstain labels
train.py           QLoRA (assistant-turn loss only), writes out/train_meta.json
evaluate.py        base/v1/v2 on the same held-out: mechanical check + evidence-fed judge
out/eval_results.json, out/eval_results_v1.json   full per-case detail
```

The synthetic corpus lives in med-rag-vertex; no clinical data is real, none ships here.

---
© 2026 hyunaeee · MIT (code) — see the [portfolio](https://hyunaeee.github.io/aengdo-portfolio/en.html)
