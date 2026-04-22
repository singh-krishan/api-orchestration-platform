import type { Severity } from '@/types';

export interface JournalScript {
  onStart?: { message: string; severity?: Severity };
  onComplete?: { message: string; severity?: Severity };
}

/** Per-agent narrative templates. Stakeholder-friendly English. */
export const AGENT_JOURNAL: Record<string, JournalScript> = {
  // Stage 1
  'interface-spec-ingestion': {
    onStart: { message: 'Interface Spec Ingestion Agent is parsing the uploaded specification.' },
    onComplete: {
      message:
        'Interface Spec Ingestion Agent inferred 5 endpoints and identified OAuth 2.0 + mTLS as the target auth model.',
      severity: 'success'
    }
  },
  'oas-authoring': {
    onStart: { message: 'OAS Authoring Agent is drafting an OpenAPI 3.1 contract from the parsed interface.' },
    onComplete: {
      message:
        'OAS Authoring Agent produced payments-api.yaml covering /payments, /payments/{id}, /reconciliations, /refunds and /health.',
      severity: 'success'
    }
  },
  'oas-quality': {
    onStart: { message: 'OAS Quality Agent is validating the draft contract against platform guardrails.' },
    onComplete: {
      message:
        'OAS Quality Agent passed the contract with 0 errors and 1 advisory (missing example payload on 202).',
      severity: 'success'
    }
  },

  // Stage 2
  'archetype-template': {
    onStart: { message: 'Archetype Template Agent is materialising the Enterprise Integration Spring Boot 3.3 archetype.' },
    onComplete: {
      message: 'Archetype Template Agent scaffolded the repo with Gradle, Helm chart and opinionated platform defaults.',
      severity: 'success'
    }
  },
  'implementation': {
    onStart: { message: 'Implementation Agent is generating controllers, services and unit tests from the OAS.' },
    onComplete: {
      message:
        'Implementation Agent generated 3 controllers, 4 domain types, 2 services and 147 unit tests — compiles clean.',
      severity: 'success'
    }
  },
  'gitlab-simulation': {
    onStart: { message: 'GitLab Simulation Agent is committing to feature/payments-reconciliation-v1 and opening the merge request.' },
    onComplete: {
      message: 'GitLab Simulation Agent pushed 8 commits and published the .gitlab-ci.yml with 9 pipeline stages.',
      severity: 'success'
    }
  },

  // Stage 3
  'local-build': {
    onStart: { message: 'Local Build Agent is running ./gradlew clean assemble.' },
    onComplete: { message: 'Local Build Agent completed the build in 42s — all 17 tasks actioned.', severity: 'success' }
  },
  'regression-test': {
    onStart: { message: 'Regression Test Agent is running the full suite (unit + contract + regression).' },
    onComplete: {
      message: 'Regression Test Agent reports 147/147 unit tests passing with 91.2% line coverage.',
      severity: 'success'
    }
  },
  'quality-gate': {
    onStart: { message: 'Quality Gate Agent is applying the SonarQube quality gate.' },
    onComplete: { message: 'Quality Gate Agent PASSED — A/A/A ratings, 4 minor code smells.', severity: 'success' }
  },
  'security-assessment': {
    onStart: { message: 'Security Assessment Agent is running SAST and SCA scans.' },
    onComplete: {
      message: 'Security Assessment Agent found 0 HIGH+ findings; SBOM attested (142 components).',
      severity: 'success'
    }
  },

  // Stage 4 — AI Governance & Evals
  'governance-eval': {
    onStart: { message: 'AI Output Eval Agent is scoring generated code against the eval harness.' },
    onComplete: {
      message: 'AI Output Eval Agent scored 96/100 — style A, hallucination risk LOW, spec fidelity 0.98 vs OAS.',
      severity: 'success'
    }
  },
  'policy-check': {
    onStart: { message: 'Governance Policy Agent is evaluating output against organisation ADRs and policy rules.' },
    onComplete: {
      message: 'Governance Policy Agent PASSED — 0 ADR violations, 0 forbidden patterns, all dependencies on license allowlist.',
      severity: 'success'
    }
  },

  // Stage 5 — MR Validation
  'mr-pipeline': {
    onStart: { message: 'MR Pipeline Agent is running the full CI pipeline against the merge-result ref.' },
    onComplete: {
      message: 'MR Pipeline Agent completed 9/9 CI stages in 2m 41s — build, test, quality, security all green on merge-result.',
      severity: 'success'
    }
  },
  'mergeability-check': {
    onStart: { message: 'Mergeability Agent is checking protected-branch rules, approvals and conflict status.' },
    onComplete: {
      message: 'Mergeability Agent confirmed 2 approvals present, 0 conflicts, all required checks passed.',
      severity: 'success'
    }
  },
  'main-merge': {
    onStart: { message: 'Main Branch Merge Agent is squash-merging feature/payments-reconciliation-v1 into main.' },
    onComplete: {
      message: 'Main Branch Merge Agent merged to main at commit 7a3f1c9, tagged rc-v1.0.0-rc.1.',
      severity: 'success'
    }
  },

  // Stage 6
  'sit-deploy': {
    onStart: { message: 'SIT Deploy Agent is rolling out the release to payments-sit.' },
    onComplete: {
      message: 'SIT Deploy Agent brought 3/3 replicas to READY in 38s. Readiness probes green.',
      severity: 'success'
    }
  },
  'smoke-test': {
    onStart: { message: 'Smoke Test Agent is running the post-deploy probe suite.' },
    onComplete: { message: 'Smoke Test Agent confirms 5/5 probes green — golden path healthy in SIT.', severity: 'success' }
  },
  'integration-coordination': {
    onStart: { message: 'Integration Coordination Agent is orchestrating 27 partner-channel scenarios.' },
    onComplete: {
      message: 'Integration Coordination Agent reports 27/27 scenarios passing across BACS, FPS and Settlement Broker.',
      severity: 'success'
    }
  },

  // Stage 7
  'preprod-deploy': {
    onStart: { message: 'Pre-Prod Deploy Agent is running blue/green rollout with a 10% canary.' },
    onComplete: {
      message: 'Pre-Prod Deploy Agent shifted canary successfully — 0.0% error rate, p95 182 ms over 15 min.',
      severity: 'success'
    }
  },
  'release-readiness': {
    onStart: { message: 'Release Readiness Agent is auditing gates and drafting release notes.' },
    onComplete: {
      message: 'Release Readiness Agent completed the checklist — 9/10 gates PASSED, 1 pending human CAB approval.',
      severity: 'success'
    }
  },

  // Stage 8
  'production-approval': {
    onStart: { message: 'Production Approval Agent is assembling the final release pack.' },
    onComplete: {
      message:
        'Production Approval Agent has staged the release pack and raised the production gate. Human approval required.',
      severity: 'milestone'
    }
  }
};

export const STAGE_MILESTONES: Record<string, { enter?: string; complete?: string }> = {
  'spec-ingestion': {
    enter: 'Stage 1 — Interface Spec Ingestion & API Contract Design is starting.',
    complete: 'Stage 1 complete. OpenAPI contract and validation report are available.'
  },
  'build-generation': {
    enter: 'Stage 2 — Build Generation is starting.',
    complete: 'Stage 2 complete. Repository scaffolded and pushed to GitLab.'
  },
  'dev-validation': {
    enter: 'Stage 3 — Development Validation is starting.',
    complete: 'Stage 3 complete. Build, tests, quality and security gates all green.'
  },
  'ai-governance-eval': {
    enter: 'Stage 4 — AI Governance & Evals is starting.',
    complete: 'Stage 4 complete. AI output cleared all governance and eval checks.'
  },
  'mr-validation': {
    enter: 'Stage 5 — Merge Request Validation is starting.',
    complete: 'Stage 5 complete. MR pipeline green and merged into main.'
  },
  sit: {
    enter: 'Stage 6 — System Integration Test is starting.',
    complete: 'Stage 6 complete. SIT deployment and integration tests are green.'
  },
  staging: {
    enter: 'Stage 7 — Staging / Pre-Prod is starting.',
    complete: 'Stage 7 complete. Canary successful; release notes drafted.'
  },
  'production-pack': {
    enter: 'Stage 8 — Production Release Pack is starting.',
    complete:
      'Release pack assembled. Ready for Production Deployment — Pending Human Approval.'
  }
};
