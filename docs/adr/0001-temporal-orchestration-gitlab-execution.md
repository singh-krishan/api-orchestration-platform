# ADR-0001: Use Temporal for orchestration; GitLab for CI execution

- **Status:** Accepted
- **Date:** 2026-04-22
- **Deciders:** Platform architecture
- **Supersedes:** —
- **Superseded by:** —

## Context

The AI API Delivery Platform orchestrates the end-to-end SDLC of an OAS-driven REST API: spec ingestion, OAS authoring, code generation, CI, governance, SIT, pre-prod, and a human-gated production release. A recurring question from engineering leadership is:

> *Can we build the whole thing in GitLab (CI pipelines, manual jobs, environments, webhooks)? Or do we need a dedicated workflow engine like Temporal?*

GitLab is already the enterprise standard for source control and CI. It is attractive to consolidate: one less system to run, one less vendor to govern, one less technology to hire for. This ADR records the decision, the rationale, and the alternatives considered.

### Workload characteristics that drive the decision

1. **Long-lived human approvals.** Pre-Prod and Production gates can sit pending for days or weeks (CAB windows, security-review SLAs, release-freeze periods).
2. **Cross-repo orchestration.** A single run touches the platform repo, the service repo, archetype repos, a standards repo, a GitOps config repo, and partner fixture libraries.
3. **Durable workflow state.** An operator must be able to ask *"where is run 1234"* weeks after it was started, and resume it safely.
4. **Heterogeneous work.** Steps include CI-shaped work (build, test, scan) *and* non-CI work (LLM calls with cost/latency budgets, OPA policy evaluation, release-pack signing, GitLab project provisioning, Slack/Jira integration).
5. **Workflow evolution.** The platform's workflow logic will change while runs are in flight — a run paused at a human gate must be resumable after the platform's own code has shipped a new version.
6. **Audit and compliance.** Every transition, activity, approval, and artefact must be traceable to an append-only audit event. Retention: 7 years for release-grade records.
7. **Failure semantics.** Some failures are transient (network flakes), some are hard (policy violation). Retry policies differ per activity. A partial run may need compensating actions (close an MR, tear down an ephemeral environment).

## Decision

**Use Temporal as the orchestration engine. Use GitLab CI as the execution substrate for the generated services' build/test/deploy pipelines. Temporal sits above GitLab, not instead of it.**

Concretely:

- Temporal owns: durable run state, stage sequencing, human-approval signals, retry policies, workflow versioning (`patched()`), audit events, checkpoints, cross-repo coordination, LLM activity scheduling, policy evaluation, release-pack compilation.
- GitLab owns: source control, per-service CI pipelines, MR approvals, protected branches, CODEOWNERS, job artefacts, and the runner pool for build/test/scan jobs.
- Integration: Temporal activities *trigger* GitLab pipelines via API. GitLab *reports* completion via HMAC-signed webhooks, which the Control Plane API relays as Temporal signals. No polling on the critical path.

## Rationale

### What GitLab is genuinely good at

- Executing a pipeline against a commit (build, test, scan, deploy).
- `when: manual` gates for short, in-session human approvals.
- Multi-project triggers (`trigger:`, `include:`) for fan-out to related repos.
- Environments with required approvers (Premium/Ultimate tiers).
- MR approvals, protected branches, CODEOWNERS.

For a single-repo, linear flow with short human waits and no durable cross-repo state, GitLab alone is sufficient.

### Where GitLab falls short for *this* workload

| Requirement | Native in GitLab? | Why it matters here |
|---|---|---|
| Human approval that can sit for **days or weeks** | No — job timeout caps, pipeline TTL (max 1 week for manual jobs) | Production CAB windows, security-review SLAs |
| **Durable workflow state** spanning many pipelines and repos | No — state is per-pipeline | One run spans ≥ 4 repos; the run object needs a home |
| Signals — *"wake up when approval arrives"* | Webhook-shaped, not signal-shaped | Forces orchestration-by-chained-pipelines; the pause point is implicit |
| **Activity-level retry policies** (hard vs soft errors, exponential backoff per step) | Job-level only | Every flake becomes a full stage re-run |
| **Workflow versioning** — resume a run safely after a platform update | No | In-flight runs break on platform deploys |
| **Sagas / compensation** — undo a partially-successful run | No | Compensation would be hand-rolled YAML |
| **Non-CI work** — LLM calls with cost budgets, OPA evaluation, release-pack signing | Executes, but awkwardly | Jobs that are 90 % `curl` are hard to audit and observe |
| **Single pane of glass** — "where is run 1234" | No — pipeline-centric view | Operators chase state across multiple pipeline histories |
| **Determinism boundary** — workflow logic vs side effects | No | No discipline enforcing pure workflow code vs activity I/O |
| **First-class visibility API** for operators and auditors | Limited | GitLab's audit events are rich for SCM, thin for platform-domain events |

### Why Temporal specifically (vs other workflow engines)

- **Durable execution.** Workflow code survives process/host restarts; activities retry per policy; timers persist.
- **Signals** map cleanly to human approvals (`workflow.waitSignal("preprod-approved")`).
- **Visibility** (list-workflows, search attributes) gives operators a production console for free.
- **Local dev** is fast and deterministic (time-skipping test server).
- **Versioning** (patched workflows) is first-class and essential for a platform that ships continuously.
- **No hidden state.** Everything the workflow knows is captured in event history; debugging is reading an event log.

Alternatives — see below.

### Cost of ownership

| Option | Initial | Ongoing | Risk |
|---|---|---|---|
| **Temporal on EKS** | ~2–3 engineer-weeks | ~10 % of a platform engineer | Moderate ops burden, predictable |
| **Temporal Cloud** | ~1 engineer-week | ~$2–5 k/mo at small scale, near-zero ops | SaaS dependency, data residency review required |
| **GitLab-only, re-implement missing features** | 6–12 engineer-months | 20–30 % of a platform engineer permanently maintaining the state machine in YAML + Postgres + webhooks + cron | High — every feature Temporal has is a gap you'll hit at the worst moment |

## Alternatives considered

### A. GitLab CI as the orchestrator (chained parent/child pipelines, manual jobs, downstream triggers)

- **Pros:** no new infra, enterprise-approved, known to team.
- **Cons:** see gap table above. In practice: long-wait approvals break on pipeline TTLs; cross-repo state has no home; no workflow versioning; no compensation; no single run-object view. Teams that have tried this at similar scope end up writing a state machine in sidecar Postgres and a cron process — i.e., a home-built Temporal, minus the tooling.
- **Verdict:** Rejected. Works for small linear flows; fails the workload characteristics above.

### B. AWS Step Functions (Standard)

- **Pros:** managed, AWS-native, integrates with IAM and EventBridge, decent visual console.
- **Cons:** ASL (state machine JSON) is expressive but clumsy for multi-branch workflows; signals are modelled as `waitForTaskToken` but the DX is poor; local dev story is weak; versioning exists but is less ergonomic than Temporal's `patched()`; saga patterns require manual modelling; per-state cost adds up on long-running workflows.
- **Verdict:** Acceptable fallback if cloud-lock-in is mandated. Still inferior on dev ergonomics and debuggability. Default to Temporal; pick Step Functions only under hard "AWS-native only" policy.

### C. Apache Airflow / Dagster / Prefect

- **Pros:** mature, Python-native, good DAG UI.
- **Cons:** these are batch/scheduled-pipeline systems. Long-running human gates, signals, sub-minute activity retries, and workflow versioning are not their design centre. Airflow especially struggles with long-lived waits.
- **Verdict:** Rejected. Wrong shape of tool.

### D. Home-grown orchestrator (queue + Postgres + worker pool)

- **Pros:** full control, no vendor dependency.
- **Cons:** this is Temporal's problem domain. Building it well takes years; building it adequately still yields something worse on every axis (visibility, testing, retries, versioning).
- **Verdict:** Rejected. Not a good use of engineering capital.

### E. Argo Workflows (Kubernetes-native)

- **Pros:** native to K8s, good for CI-like DAGs.
- **Cons:** similar to Step Functions on the signal/versioning/visibility axes; long-lived workflows with external human signals are awkward; weaker SDK-style programming model.
- **Verdict:** Rejected for this workload.

### F. Camunda / Zeebe (BPMN workflow engines)

- **Pros:** strong process-modelling heritage, good for business workflows.
- **Cons:** BPMN-first mental model is a poor fit for an engineering-centric platform; tooling aimed at BPM analysts not platform teams; licensing cost; team skill rarity.
- **Verdict:** Rejected.

## Consequences

### Positive

- Clear separation of concerns: GitLab executes code-level CI; Temporal orchestrates the run.
- Durable, versioned workflow state survives platform deploys — in-flight runs are not collateral damage when the platform ships.
- Human-approval gates are first-class, with timeouts measured in days/weeks, not hours.
- Per-activity retry policies allow nuanced failure handling (flake retry, hard fail on policy violation).
- Operators have a single pane of glass for run state (Temporal Web + custom console).
- Testability improves materially — workflow code is pure and unit-testable; activities are mocked.
- LLM workers can be scaled and budgeted independently of CI runners.

### Negative

- One more platform component to run (or pay for, if Temporal Cloud).
- Team must learn Temporal's SDK idioms and the non-determinism boundary rule (workflow code stays pure; side effects go in activities).
- Local dev story requires Temporal dev server in the stack (manageable — it's a single binary).
- Introduces a second authoritative system for run state (alongside Postgres); integration (outbox, visibility API usage) must be designed carefully.

### Neutral

- GitLab is untouched and remains the source of truth for code and CI. Existing GitLab investment is preserved; pipelines authored by tenant teams still work as-is.
- The Control Plane API becomes a thin facade over Temporal + Postgres; most business logic lives in workflow/activity code, not in REST controllers.

## When this decision should be revisited

- If GitLab ships native long-running workflow orchestration with signal semantics, versioning, and activity-level retry policies *equivalent to Temporal's*. (Not expected on any known roadmap.)
- If the platform scope is drastically reduced (single-repo, single-archetype, short waits only) — in which case GitLab-only may become viable.
- If Temporal's operational cost becomes material relative to platform spend (unlikely at v1/v2 scale).

## Implementation notes

- Temporal namespace per environment (`delivery-dev`, `delivery-prod`).
- Workflow worker build SHA is pinned per deploy; workflow code changes are gated by `patched()` blocks and tested against a replay corpus.
- GitLab → Temporal signal relay is a dedicated Control Plane endpoint with HMAC verification and idempotency on `(pipeline_id, event_type)`.
- All outbound GitLab API calls are wrapped in an activity with its own retry policy; credentials are issued by Vault with ≤ 1 h TTL.
- Temporal event history is the engineering-facing audit trail; AuditEvent in Postgres is the compliance-facing audit trail. Both are written for every state-changing activity via the outbox pattern.

## References

- [`docs/IMPLEMENTATION_BLUEPRINT.md`](../IMPLEMENTATION_BLUEPRINT.md) — §2 (Tech Stack), §5 (Orchestration Model), §8.1 (GitLab integration).
- Temporal documentation: https://docs.temporal.io
- GitLab CI/CD reference: https://docs.gitlab.com/ee/ci/
