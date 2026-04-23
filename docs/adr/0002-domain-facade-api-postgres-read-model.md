# ADR-0002: Domain-facade API with a Postgres read model for the UI

- **Status:** Accepted
- **Date:** 2026-04-23
- **Deciders:** Platform architecture
- **Supersedes:** —
- **Superseded by:** —
- **Related:** [ADR-0001](./0001-temporal-orchestration-gitlab-execution.md)

## Context

[ADR-0001](./0001-temporal-orchestration-gitlab-execution.md) established Temporal as the orchestration engine. The natural next question is *how does the Delivery Console talk to it?*

Temporal ships an operator Web UI (workflow event history, resets, terminate/signal tools). It is excellent for platform engineers debugging the system and **unsuitable as a product UI** — it exposes Temporal concepts (WorkflowId, RunId, event types), not the domain (Run, Stage, Agent, Artifact, Approval). We need a production UI for reviewers, release managers, CAB, and service teams that looks and reads like a delivery console, not a workflow debugger.

The UI needs to:

- Show the current state of a run (per-stage, per-agent) in near-real-time.
- Stream journal / audit events as they happen.
- Let users trigger commands (pause, resume, approve, apply-mock-fix, restart) safely.
- Render artefacts with type-aware previews (YAML, JSON, Markdown, Java, logs).
- Surface approval banners and let approvers act.
- Remain responsive with hundreds of concurrent runs.

The UI must **not** know that Temporal exists.

## Decision

**Build a domain-facade API in front of Temporal and Postgres. The UI talks only to the facade. Workflow state is replicated into Postgres by activities so the UI reads from a fast domain-shaped store; WebSocket/SSE delivers incremental updates; Temporal Queries are a fallback, not the hot path.**

### Architecture

```
Browser (React console)
   │  REST  + WebSocket / SSE (domain API only)
   ▼
Control Plane API  (Spring Boot)
   │                         │                    │
   │ Temporal SDK            │ SQL                │ S3 / KMS
   ▼                         ▼                    ▼
Temporal              Postgres (read model)    Artefact store
 (durable state,       run, stage_execution,
  timers, signals)     agent_task_execution,
                       artifact, approval,
                       audit_event
```

### Responsibilities

- **Temporal** — source of truth for *workflow* state: what stage is next, which activity is running, when to time out, how to retry, when to wake on a signal.
- **Postgres** — source of truth for *domain* state as projected by the workflow: a denormalised read model that the UI can query and index freely. Updated by activities (`persistStageState`, `persistAgentState`, `persistArtifact`, `persistAudit`) written via the outbox pattern so activity state and DB state commit atomically.
- **Control Plane API** — the only surface the UI sees. Exposes `Run`, `Stage`, `Artifact`, `Approval` — never `WorkflowId`/`RunId`/event types. Commands hit the API, which translates them into Temporal signals or starts.
- **Browser** — never connects to Temporal. No Temporal SDK in the frontend bundle.

### Read path (how the UI gets live state)

1. On page load, UI calls `GET /runs/:id` — returns a full snapshot from Postgres.
2. UI opens a WebSocket (or SSE) to `/runs/:id/stream`.
3. As activities run, they write to Postgres via the outbox pattern. A relay process (`LISTEN/NOTIFY` or logical replication) fans out the changes to all subscribed WebSocket sessions.
4. For correctness checks on demand, the API can call `workflowHandle.query(getState)` to read directly from the running workflow. This is a **fallback**, not the hot path.

### Write path (how the UI sends commands)

| UI action | API endpoint | Temporal operation |
|---|---|---|
| Start a run | `POST /runs` | `client.startWorkflow(DeliveryWorkflow, input)` |
| Pause | `POST /runs/:id/pause` | `handle.signal("pause")` |
| Resume | `POST /runs/:id/resume` | `handle.signal("resume")` |
| Apply Mock Fix | `POST /runs/:id/apply-fix` | `handle.signal("fix", { runId, fixPayload })` |
| Resume from Checkpoint | `POST /runs/:id/resume-from-checkpoint` | starts a new workflow seeded with the prior run's checkpoint |
| Approve Pre-Prod | `POST /runs/:id/approvals/preprod` | `handle.signal("preprod-approved", { approver, note })` |
| Approve Production | `POST /runs/:id/approvals/production` | `handle.signal("prod-approved", { approver, note })` |
| Restart | `POST /runs/:id/restart` | start a fresh workflow with the same input |

Every write is authenticated, authorised (RBAC + separation-of-duties), and produces an `AuditEvent`. The signal payload includes the actor identity so workflow code can record it.

## Alternatives considered

### A. Browser connects directly to Temporal

- Use the Temporal gRPC-Web endpoint from React.
- **Rejected.** No auth story for browsers; CORS and connection pooling nightmares; leaks Temporal concepts into the UI; ties the browser bundle to the workflow-engine choice; operator surface would be exposed to end users.

### B. Facade API, but poll everything — no WebSockets

- UI polls `GET /runs/:id` every N seconds.
- **Rejected for the hot path.** At 1–2 s intervals this is expensive for dozens of live runs and still perceptibly laggy. We use polling as a fallback reconnection strategy only.

### C. Facade API reads state from Temporal Queries, no Postgres read model

- On every `GET`, the API calls `handle.query(getState)` to fetch live state.
- **Rejected.** Queries work but come with real costs: each is a round-trip into the workflow worker; they block on worker availability; history replay dominates latency for long-running workflows; you lose the ability to index/search across runs; and any UI that needs cross-run views (all pending approvals, runs by tenant, runs by outcome) can't be built. Postgres read model is mandatory for any non-trivial product UI.

### D. GraphQL subscriptions instead of WebSocket/SSE

- Use GraphQL with subscriptions as the single UI contract.
- **Deferred.** Attractive if the API surface grows large and heterogeneous. For v1 the API is small and REST + WS is simpler to operate. Revisit in Phase 2 if the number of entities and queries justifies it.

### E. Event-sourced UI reading directly from an event stream (Kafka/EventBridge)

- Publish every state change to an event bus; UI subscribes via WS.
- **Rejected for v1.** Adds a bus to the hot path without a commensurate benefit; the outbox-to-WebSocket flow already provides real-time updates with simpler operations. Keep EventBridge for outbound cross-system events (Jira, Slack, analytics), not for the UI.

### F. Server-Sent Events (SSE) vs WebSocket

- **Accepted either.** SSE is simpler (HTTP/1.1, unidirectional server→client, natural reconnection). WebSocket is bidirectional but overkill for a predominantly read-only stream. **Recommendation: SSE for v1.** Switch to WebSocket only if the product needs client→server messaging over the same channel.

## Rationale

- **Decoupling the UI from the workflow engine** protects the frontend from engine churn and preserves optionality. The simulation console in this repo was built with no Temporal dependency; the real console should inherit that property.
- **A domain-shaped read model** (Postgres) is cheap, flexible, and correct for every UI need — single-run detail, cross-run search, dashboards, approvals queues, SLA timers. Temporal Queries cannot service these.
- **Outbox-pattern persistence** from activities gives exactly-once semantics between workflow state and DB state without distributed transactions.
- **SSE for live updates** delivers the "watching the pipeline tick" feel the simulation already demonstrates, with seconds-level latency and trivial operations.
- **Facade naming** (Run, Stage, Agent, Artifact, Approval) is the contract. Never leak WorkflowId/RunId into public APIs. If a backend-only identifier is needed for support, expose it in an operator-only endpoint behind SSO.

## The simulation console is the target UX

The React console in this repo is designed the same way the real console should be:

- It knows about `Run`, `Stage`, `AgentTask`, `Artifact`, `Approval`.
- It has no concept of Temporal.
- It receives state via a store (`useOrchestrationStore`) that, in the simulation, is driven by `simulationEngine.ts` calling the same mutation surface the API would call over WebSocket.

Replacing the simulation engine with a real WebSocket client + REST adapter produces the production console. The UI doesn't change shape — only the driver does.

### Concrete mapping (simulation → production)

| Simulation concern | Production equivalent |
|---|---|
| `simulationEngine.start(index)` | `POST /runs` from the intake screen |
| `store.setAgentState(...)` called locally | WebSocket message from Control Plane API → same store mutation |
| `store.emitJournal(...)` called locally | WebSocket message mirroring an `AuditEvent` row |
| `simulationEngine.pause() / resume()` | `POST /runs/:id/pause` / `resume` |
| `approveAndDeployPreprod()` (local state flip) | `POST /runs/:id/approvals/preprod` → server signals workflow → WebSocket update |
| Scripted failure injection | Scenario flag on the start request → workflow decides where to fail |
| Click "Apply Mock Fix" | `POST /runs/:id/apply-fix` — for v1 this is a literal signal to the workflow; in production v2 it may be a ticket-open flow |

## Consequences

### Positive

- UI is portable across workflow engines (future-proof).
- Fast UI reads (Postgres with indexes), no Temporal Query hot path.
- Cross-run views (queues, dashboards, search) are trivial SQL.
- Clean RBAC boundary — UI sees only what the facade allows.
- Auditable — every UI write produces an `AuditEvent`.
- Operators still have Temporal Web UI for debugging, gated behind SSO.

### Negative

- Two authoritative state stores (Temporal + Postgres) require careful outbox discipline. Drift between them is possible if an activity writes to Postgres but the workflow event is lost — mitigated by idempotent writes keyed on `(run_id, stage_id, activity_name, attempt)`.
- More moving parts than "UI reads straight from Temporal", but the simpler option (D above) fails as soon as the product needs cross-run views.

### Neutral

- Facade API becomes a meaningful engineering asset in its own right and must be versioned like any public API.

## Implementation notes

- **Persistence activities** write via the outbox pattern: the activity's business-state write and the domain-event insert happen in the same local transaction; a relay process ships events to WebSocket subscribers.
- **WebSocket/SSE endpoint** authenticates via the user's session; emits only events the user is authorised to see (per-tenant, per-role).
- **Reconnect** is handled by the UI with last-seen event id; on reconnect, the API replays missed events from `audit_event` since that id.
- **Backpressure** — if a client can't keep up, the API coalesces events and sends snapshot refreshes. Sustained slow clients are disconnected; UI falls back to polling.
- **Operator surface** (`/ops`) retains the raw Temporal Web UI and direct DB tools for on-call, gated behind engineer-only SSO groups. Never exposed to product users.

## When to revisit

- If the API surface grows large enough that GraphQL subscriptions materially reduce client complexity.
- If regulatory requirements force event-sourced UI state (uncommon).
- If Temporal adds first-class domain-shaped read APIs with multi-run search (not expected).

## References

- [`docs/IMPLEMENTATION_BLUEPRINT.md`](../IMPLEMENTATION_BLUEPRINT.md) — §3 (Reference Architecture), §5 (Orchestration Model), §7 (Data Model).
- [ADR-0001](./0001-temporal-orchestration-gitlab-execution.md) — orchestration choice.
- The simulation console in `src/` — design reference for the production UI.
