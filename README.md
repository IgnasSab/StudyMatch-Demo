# StudyMatch Demo

StudyMatch is an automation tool for research recruitment: reusable participant profiles, eligibility screening, personalized study discovery and session booking. Researchers review prepared study details and screening questions before publication.

**Public demo:** https://studymatch-swart.vercel.app/

## What runs in the public demo

The React app runs entirely in the browser, with fictional studies, participants and prepared document-import results. No backend, login, database or API key is required. Data lives in the current browser tab; refreshing or resetting starts over. Live AI, arbitrary PDF uploads, external notifications, payments and calendar integrations are not connected.

The original authenticated Python application is retained separately. See [full-app setup and architecture](docs/full-app.md); it is not deployed as part of the public demo.

## Run locally

One-time Windows setup from the repository root:

```powershell
conda env create --file environment.yml
conda run --no-capture-output --name studymatch-demo npm.cmd --prefix frontend ci
```

Launch:

```powershell
.\start-demo.ps1
```

Open **http://127.0.0.1:4173**. The launcher builds and serves the demo through the `studymatch-demo` Conda environment; no manual activation is needed. Keep that terminal open and press Ctrl+C to stop. If the port is already occupied, stop the existing preview first. Re-run `npm ci` after dependency or lockfile changes.

For hot-reloading development:

```powershell
conda run --no-capture-output --name studymatch-demo npm.cmd --prefix frontend run dev:demo
```

Without Conda, use an existing Node.js 22.12+ installation:

```sh
npm --prefix frontend ci
npm --prefix frontend run build:demo
npm --prefix frontend run start:demo
```

## Demo flow

Start the participant tour, complete the profile walkthrough, discover and rank studies, answer remaining eligibility questions, book a session and switch to the researcher view. Continue with the researcher tour to import the sample document, review editable details and questions, set sessions and publish.

Next performs prepared actions; Back and Restart restore snapshots without duplicate bookings or publication. Exit tour or Escape opens free exploration at the current scene. The white top bar retains green participant and red researcher controls. The floating tour controls stay above the full-height workspace; the active content and sidebar section are highlighted together.

Free exploration supports search, filters, preferences, screening, calendar booking and editable study/question forms. Four studies are seeded; publication adds a fifth. Editing a study draft clears approval. Starting a researcher tour removes the fifth sample study but preserves bookings for the original four; starting a participant tour retains published studies and resets the participant's answers, preferences and bookings.

## Checks

```sh
npm --prefix frontend run test:demo
npm --prefix frontend run test:demo:browser
```

Browser tests use installed Google Chrome via Playwright. They build the demo and run a separate preview on port 4175. Coverage includes tours, rewind/restart/exit, shared bookings, edited publication, eligibility, keyboard focus, laptop/phone layouts, contrast, reduced motion and absence of backend requests. Screenshots and reports are ignored by Git.

`npm --prefix frontend run build` builds the retained authenticated app, **not** the public demo. Backend tests are documented in [docs/full-app.md](docs/full-app.md).

## Deploy

Import `IgnasSab/StudyMatch-Demo` into Vercel, select production branch `main`, and keep Root Directory at **`.`**, not `frontend`. `vercel.json` installs frontend dependencies, runs `build:demo` and publishes `frontend/dist`. `.vercelignore` excludes the Python backend, private local files and generated output. No environment variables or database are needed.

With Vercel's Git integration connected, pushes to the configured production branch trigger deployments. A local build does not deploy anything. Deployment Protection controls access; `noindex` discourages indexing but is not authentication.

## Repository guide

- `frontend/src/demo.jsx`, `demo-tours.js`, `demo.css`: entry, guided tours and demo presentation.
- `frontend/src/demo-state.js`: fictional data and the in-memory API adapter.
- `frontend/src/participant.jsx`, `researcher.jsx`, `profile.jsx`, `calendar.jsx`: shared application screens.
- `frontend/tests/`: browser and demo-state tests.
- `backend/`, `tests/`, `requirements.txt`: retained FastAPI app and backend tests.
- [Product brief](STUDYMATCH_PROJECT_BRIEF.md): product vision, safeguards and future scope—not a list of implemented demo features.
- [Full-app guide](docs/full-app.md): Python setup, AI extraction, storage and API behavior.
- [API contract](docs/api-contract.md), [product context](PRODUCT.md), [design system](DESIGN.md).
- [Hackathon notes](docs/hackathon-notes.md): original event context and team guidance.

Local environment files, databases, dependencies, build output, test reports and editor workspace files stay out of Git. Never copy private questionnaire responses or personal research records into public fixtures.
