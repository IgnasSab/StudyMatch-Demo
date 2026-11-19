# Retained full application

This is the original authenticated React/Vite + FastAPI + SQLite application. It remains available for local development, but the public Vercel demo does not run this backend, access its database or call live AI.

## Run locally

Requires Python 3.12 and Node.js 22.12+. From the repository root on Windows:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm --prefix frontend ci
npm --prefix frontend run build
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. FastAPI serves the built frontend and API together. On macOS/Linux use `python3.12` and `.venv/bin/python`. During frontend development, `npm --prefix frontend run dev` proxies API requests to port 8000.

Optional live extraction: copy `.env.example` to `.env` and set `OPENAI_API_KEY`. Never commit it. Only researcher-provided study text goes to the model; participant profiles do not. Text PDF extraction accepts up to 5 MB and 20 pages. Scans need pasted text. AI failures are surfaced; the explicitly labelled sample works offline.

## Stack and data flow

React renders the user interface, using JavaScript/JSX and plain CSS. Vite supplies the development server and production build. FullCalendar renders the booking calendar; Lucide provides icons. The public demo additionally uses Driver.js for the guided-tour highlights and a JavaScript in-memory API adapter instead of a server.

The full app uses FastAPI for HTTP endpoints, Uvicorn to run the Python server, SQLite for persistence and Pydantic for structured data validation. The Python OpenAI SDK prepares study drafts; pypdf reads text from PDFs. This is a separate execution path from the browser-only demo.

## AI extraction and matching

FastAPI calls OpenAI through the Python SDK's `responses.parse`, using `gpt-4.1-mini` by default (`OPENAI_MODEL` can override it). A structured-output request turns researcher text into clean public study fields, private eligibility rules, additional questions and a convenience score. The prompt removes administrative clutter while retaining inclusion/exclusion requirements and source wording. Pydantic validates the result; source quotations and review flags are checked before storing the draft. PDF text is extracted locally first.

Researchers choose topics, correct source facts and approve publication. The authenticated app keeps rules and convenience ratings AI-prepared; editing facts requires a fresh preview. The public demo's editable prepared forms use fictional fixtures instead.

Eligibility and ranking run in Python against saved data. Birth date supplies current age; university requirements use normalized names, and language requirements use explicit proficiency. Known ordinary failures are excluded first. Unknown facts become targeted questions. Safety-sensitive or ambiguous cases retain authorized human review. Participant profiles, medical answers and review notes never go to OpenAI.

Preference scoring is independent of eligibility. Each component is between 1 and 5:

- Interest: 1 + 4 × shared topic count / participant's selected topic count; 1 when no interests are selected.
- Earnings: 1 + 4 × min(hourly compensation / £25, 1).
- Convenience: a stored AI-prepared assessment of study burden, from 1 to 5.
- Final preference fit: the weighted mean of the three components, rounded to one decimal—not an eligibility probability.

Interests and priority weights are set during signup and edited in Profile & preferences. Discovery filters by format, topic and eligibility. Extra location, duration and time preference controls and their hidden filters were removed. Notifications are participant-scoped SQLite records; delivery remains an in-app demonstration, not external email or push delivery.

## Accounts and storage

Users register with email/password and select Participant or Researcher. Participants complete the prescreen and preferences together. Accounts, profiles, reviewed studies, answers, sessions, bookings and notifications persist in ignored `backend/studymatch-v2.sqlite3`. Existing accounts retain their data. Additional general questions are optional. The medical questionnaire is removed from the UI; legacy stored answers remain intact.

Synthetic seeded accounts both use password `StudyMatch2026!`:

- `participant@studymatch.demo`
- `researcher@studymatch.demo`

Use fictional answers when demonstrating the app. These accounts are local fixtures, not public-demo credentials.

## Human review and scope

Participants may request review for a study that needs it. The owning researcher sees the participant's necessary basic/contact details, current screening answers, expected answers, source requirements and reasons for review. Missing and failing answers are explicit; known failures block approval. Researchers attest that required external eligibility/safety checks are complete. Approval clears manual review only; it does not bypass remaining screening or booking safeguards.

There is no email verification, password recovery, payment processing, external calendar synchronization, OCR or multi-session automatic booking. Medical, safety-sensitive, conditional or unresolved criteria must not receive automatic clinical clearance from an LLM. See the [product brief](../STUDYMATCH_PROJECT_BRIEF.md) for future ideas and safeguards.

## Checks

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
npm --prefix frontend run build
```

See the [API contract](api-contract.md) before changing backend behavior. The Windows `studymatch-demo` Conda environment isolates frontend Node.js tooling; Python uses the separate `.venv` environment.
