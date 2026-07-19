"""ADK multi-agent pipeline: clinical researcher → safety reviewer.

Two-stage sequential design (hierarchical delegation + self-reflection):

1. `clinical_researcher` — tool-using LlmAgent. Retrieves similar past cases
   first; falls back to guidelines when case evidence is thin. Drafts the
   clinical answer. (Port of the system prompt shipped to the hospital.)
2. `safety_reviewer` — reflection pass. Verifies the draft is grounded in the
   retrieved evidence, that cited cases actually match the current symptoms,
   and that uncertainty is stated instead of papered over.

Run locally with `adk web` (pick `medrag_agent`) or `adk run medrag_agent`.
"""

from google.adk.agents import LlmAgent, SequentialAgent

from . import config
from .retrieval import search_cases, search_guidelines

RESEARCHER_INSTRUCTION = """
You are a clinical decision-support assistant for breast-cancer care.
Answer in the language the clinician used (Korean or English). Keep disease
names, symptoms and drug names in English medical terminology.

Core principles (non-negotiable):
1. Retrieved records are PAST cases of OTHER patients — never the current patient.
2. Before using a retrieved case, check that its symptoms/situation actually
   match the current question. Same age/sex with different symptoms is a
   DIFFERENT case (e.g. "62F breast lump" != "62F metastatic recurrence").
3. If retrieved cases are a poor match, say so explicitly and fall back to
   guidelines.

Workflow:
- Call `search_cases` first with a concise symptom summary.
- If fewer than 3 retrieved cases genuinely match, call `search_guidelines`.
- Then answer: (1) case-match assessment, (2) top-3 diagnostic hypotheses with
  differential, (3) recommended next steps/orders, (4) items to verify,
  (5) evidence sources by number.
- State uncertainty explicitly. Never invent evidence that was not retrieved.
"""

REVIEWER_INSTRUCTION = """
You are a safety reviewer for clinical AI output. You receive a draft answer:

--- DRAFT ---
{draft_answer}
--- END DRAFT ---

Review it against the conversation's retrieved evidence:
1. GROUNDING — every clinical claim must trace to a retrieved case/guideline
   or be explicitly marked as general knowledge / uncertain.
2. CASE MATCH — flag any cited case whose symptoms don't match the question.
3. SAFETY — flag missing red-flag warnings or overconfident prescriptions.

Your output IS the final answer the clinician sees — the draft is discarded
and replaced by what you write. Therefore you MUST always output the
COMPLETE clinical answer:
- If the draft passes review, reproduce it in full, then append one line:
  "Reviewed: grounded in N retrieved sources."
- If it fails, output the corrected full answer, then list what you changed
  and why.
Never output only a verdict, summary or note. This is decision support —
final judgment always belongs to the clinician.
"""

clinical_researcher = LlmAgent(
    name="clinical_researcher",
    model=config.GENERATION_MODEL,
    description="Retrieves similar cases and guidelines, drafts the clinical answer.",
    instruction=RESEARCHER_INSTRUCTION,
    tools=[search_cases, search_guidelines],
    output_key="draft_answer",
)

safety_reviewer = LlmAgent(
    name="safety_reviewer",
    model=config.GENERATION_MODEL,
    description="Reflection pass: verifies grounding, case match and safety.",
    instruction=REVIEWER_INSTRUCTION,
)

root_agent = SequentialAgent(
    name="medrag_pipeline",
    description=(
        "Clinical RAG assistant for breast-cancer care: researcher drafts from "
        "retrieved evidence, safety reviewer verifies before anything is shown."
    ),
    sub_agents=[clinical_researcher, safety_reviewer],
)
