# Architecture Decision Records

ADRs capture significant architectural decisions, the context behind them, and the alternatives considered. One ADR per decision, numbered sequentially, never edited after acceptance (supersede instead).

## Index

| # | Title | Status |
|---|---|---|
| [0001](./0001-temporal-orchestration-gitlab-execution.md) | Use Temporal for orchestration; GitLab for CI execution | Accepted |
| [0002](./0002-domain-facade-api-postgres-read-model.md) | Domain-facade API with a Postgres read model for the UI | Accepted |

## Format

Each ADR follows:

- Status, date, deciders, supersedes/superseded-by
- Context — the forces at play
- Decision — what we decided
- Rationale — why
- Alternatives considered — what we looked at and rejected
- Consequences — positive, negative, neutral
- When this decision should be revisited

## When to write one

- A decision that's hard to reverse.
- A decision that affects more than one team.
- A decision where the rationale is non-obvious from the code.
- A decision someone will inevitably question in six months.
