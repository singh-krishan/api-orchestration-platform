# AI API Delivery Orchestration Console

A stakeholder-facing **simulation** of a future internal platform that automates the full SDLC of an OAS-driven REST API using a team of collaborating AI agents.

It takes a backend interface specification as input and walks through OAS authoring, build generation, dev validation, AI governance evals, merge-request validation, SIT, pre-prod rollout, and a production release pack — with **two human approval gates** (pre-prod and production) ensuring no deployment happens without explicit sign-off.

> **This is a UI simulation only.** No real GitLab, AWS, or deployment integrations are wired up — every stage, agent, artefact, and log line is mock data scripted to feel credible to an exec audience.

**Live demo:** https://api-orchestration-platform.vercel.app

---

## What the demo shows

1. **Intake screen** — upload a spec (PDF / DOCX / YAML / JSON / TXT / MD), pick a scenario, and click **Start Orchestration**. A **View end-to-end flow** button opens a full flowchart for non-technical audiences.
2. **Pipeline canvas** — nine stages animate in sequence, each containing one or more AI agents with live state (pending → running → completed / failed), progress bars, and timings.
3. **Build journal** — streaming narrative log of everything the agents do, coloured by severity.
4. **Artifacts panel** — every stage produces realistic artefacts (OpenAPI contract, Java controllers, test reports, SonarQube output, security scans, deployment manifests, release pack). Click to preview.
5. **Human approval gates**
   - After SIT, an amber banner appears: *Approve & Deploy to Pre-Prod*.
   - After the production release pack is assembled, an emerald banner appears: *Approve & Deploy to Live*.
6. **Failure scenarios** — inject a failure at a chosen gate (OAS validation, security, SIT), watch the pipeline halt, click **Apply Mock Fix**, then **Resume from Checkpoint** to continue from the last successful stage.
7. **Pause / resume** — mid-run controls to demonstrate operator oversight.

### The nine stages

| # | Stage | What it does |
|---|---|---|
| 0 | Request Intake | Spec uploaded, scenario selected |
| 1 | Interface Spec Ingestion & API Contract Design | AI reads the spec, drafts the OpenAPI contract, QAs it |
| 2 | Build Generation | Archetype scaffold, implementation, opens a merge request |
| 3 | Dev Validation | Local build, regression tests, quality gate, security scan |
| 4 | AI Governance & Evals | Verifies AI output against internal policy & guidelines |
| 5 | Merge Request Validation | Pipeline runs against main; merges only after green |
| 6 | System Integration Testing (SIT) | Deploys to SIT, runs contract + integration tests |
| — | **Human Approval — Pre-Prod** | Reviewer approves SIT evidence |
| 7 | Staging / Pre-Prod | Automated deploy + readiness verification |
| 8 | Production Release Pack | Manifest, rollback plan, evidence bundle assembled |
| — | **Human Approval — Production** | CAB sign-off before live deployment |

### Scenarios

- **Happy Path** — clean run to the production approval gate.
- **OAS Validation Failure** — halts at Stage 1 / OAS Quality Agent.
- **Security Gate Failure** — halts at Stage 3 / Security Assessment.
- **SIT Integration Failure** — halts at Stage 6 / Integration Coordination.
- **Manual Pause / Resume Demo** — operator pauses mid-run.

---

## Tech stack

- **Vite 5** + **React 18** + **TypeScript 5**
- **Tailwind CSS 3** (dark theme, custom component primitives)
- **Framer Motion** for transitions, layout, and banner animations
- **Zustand** for the orchestration store
- **lucide-react** for icons
- **clsx** + **tailwind-merge** for className composition

No real backend — all pipeline behaviour is driven by a deterministic in-browser simulation engine (`AbortController`-based scheduler with pause-polling and failure injection).

---

## Getting started

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/singh-krishan/api-orchestration-platform.git
cd api-orchestration-platform
npm install
npm run dev
```

Open http://localhost:5173.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |

---

## How to run the demo

1. Open the app — you'll land on the intake screen.
2. *(Optional)* Click **View end-to-end flow** to walk a non-technical audience through the pipeline before starting.
3. Click **Use sample spec** (or drop your own file) to populate the uploader.
4. Watch the **Inferred API summary** populate as the spec is "parsed".
5. Pick a scenario — start with **Happy Path**.
6. Click **Start Orchestration**.
7. Let it run to the SIT gate → click **Approve & Deploy to Pre-Prod**.
8. Let it run to the production gate → click **Approve & Deploy to Live**.
9. To demo resilience, switch to a failure scenario (e.g. **Security Gate Failure**), restart, and use **Apply Mock Fix** → **Resume from Checkpoint**.

---

## Project structure

```
src/
├── app/App.tsx                    # Top-level layout + responsive shell
├── components/
│   ├── intake/                    # Intake screen + flow diagram modal
│   ├── pipeline/                  # Stage cards, connectors, agent rows
│   ├── journal/                   # Streaming build journal
│   ├── artifacts/                 # Tabbed artefact explorer + release pack
│   ├── overlays/                  # Pre-prod + prod approval banners, deploy panel
│   ├── controls/                  # Pause / Resume / Restart / Apply Mock Fix
│   └── Header.tsx
├── data/
│   ├── stages.ts                  # Stage + agent definitions & timings
│   ├── scenarios.ts               # Scenario catalogue (including failure injections)
│   ├── artifacts.ts               # Mock artefact content (YAML / JSON / MD / Java / logs)
│   └── journalScripts.ts          # Per-agent narrative templates
├── lib/
│   ├── simulationEngine.ts        # Deterministic async scheduler
│   ├── cn.ts                      # clsx + tailwind-merge helper
│   └── format.ts
├── store/orchestrationStore.ts    # Zustand store (run state, stages, journal)
├── types/index.ts                 # Shared TypeScript types
└── hooks/useElapsedTime.ts
```

---

## Deployment

The app is deployed to Vercel as a static SPA. Any `npm run build` output (`dist/`) is deployable to any static host (Netlify, Cloudflare Pages, S3 + CloudFront, GitHub Pages).

```bash
vercel --prod
```

---

## Notes for evaluators

- **Everything is simulated.** The "deploy to pre-prod" and "deploy to live" actions advance UI state only — nothing is promoted anywhere.
- **Artefact content is handcrafted mock data** — realistic enough to read, not intended for reuse.
- **The domain seed is a "Payments Reconciliation API"** (Spring Boot 3.3, OAuth 2.0 + mTLS) chosen to make the narrative feel credible in a financial-services context. Swap the sample file name and artefact bodies in `src/data/` to re-skin the demo for a different domain.

---

## License

Unlicensed — internal demo artefact.
