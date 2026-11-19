# Original hackathon context

Historical notes for the Oxford Applied AI Hackathon at Oxford Edge, 7 November 2026. These are not current deployment instructions; see the [repository README](../README.md) for the public demo.

Event: https://luma.com/lpwg9cq4  
Team and submission workspace: https://app.hack-nation.ai/e/hack-nation-oxford-hackathon

## Event constraints

- All times GMT. The final reminder said doors open at 09:00; an earlier schedule listed registration from 08:45. Briefing 09:30; team formation 09:50.
- 10:00–12:00: problem/opportunity sprint, with feedback 11:30–12:00. Lunch 12:00–13:00.
- 13:00–15:00: build sprint, with checkpoint/feedback 14:30–15:00.
- 15:00–16:00: commercialisation and pitch. Submission/preparation 16:00–16:15.
- 16:15–17:30: final pitches, 5 minutes + 3 minutes Q&A each. Awards and closing finish at 18:00.
- Organisers promised Lovable and Dotwave AI credits. Amounts and redemption details were unspecified; OpenAI API credits were not confirmed.
- Source: organiser emails from Ng Hong Wei and Hack-Nation, 6 November 2026.

## Team responsibilities

The original team plan was for 3–4 people:

- Pitch/product: own the problem, audience, value proposition, evidence of impact, why now and pitch rehearsal; help development when the pitch is on track.
- Frontend: own a minimal, self-explanatory interface and demo flow. Remove filler and generic AI copy; use coherent references and useful charts.
- Backend: one primary owner for APIs, LLM calls, data processing and storage.
- Optional fourth teammate: evaluation/integration, with explicit file ownership.

Nominate an integration owner. Read the [API contract](api-contract.md), avoid simultaneous edits to shared files, and reserve integration time before checkpoints. Use fictional profiles; never add private prescreen answers or personal research records to fixtures.

## Working principles

1. Confirm that everyone can clone, push and pull. Codex was the planned coding agent; teammates could use familiar tools. Earlier advice recommended Claude Code Max, but it was not a requirement. Verify required API access separately from model subscriptions; never commit credentials.
2. Agree the user problem, methodology and smallest useful end-to-end flow before building. Spend the initial time testing risky assumptions. Humans own product and methodological decisions.
3. Evaluate concrete results against explicit criteria and synthetic test cases. A second model's approval is not proof of correctness; keep iterations bounded.
4. Coordinate through contracts and clear frontend/backend ownership. Use focused branches and small commits, then integrate frequently.
5. Keep agent work focused. Delegate bounded tasks when useful; avoid multiple agents changing the same files.
6. Protect the demo and pitch. Freeze features early enough to rehearse, leave integration buffers and do not depend on generated video assets finishing on time.
7. Build only what earns its place. Skip unnecessary infrastructure and speculative features.

## Implementation history

The combined application incorporated questionnaire, language-proficiency, topic-discovery and notification ideas from earlier supplied prototype files (`friends/app.py`, `engine.py`, `ai.py`, `storage.py`). These paths are historical references, not required files in this repository. The retained application uses React/FastAPI and its own database, not the earlier Streamlit account selector or datastore.
