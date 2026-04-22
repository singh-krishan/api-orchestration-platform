import type { Stage } from '@/types';

/** Canonical stage + agent definitions. Mutable copies live in the store. */
export const STAGE_DEFINITIONS: Stage[] = [
  {
    id: 'intake',
    index: 0,
    name: 'Request Intake',
    shortName: 'Intake',
    description: 'Operator uploads the backend interface specification and selects a scenario.',
    state: 'pending',
    progress: 0,
    agents: [],
    artifactIds: []
  },
  {
    id: 'spec-ingestion',
    index: 1,
    name: 'Interface Spec Ingestion & API Contract Design',
    shortName: 'Spec & Contract',
    description: 'Parse the uploaded interface spec and generate a draft OpenAPI contract.',
    state: 'pending',
    progress: 0,
    agents: [
      {
        id: 'interface-spec-ingestion',
        name: 'Interface Spec Ingestion Agent',
        description: 'Parses interface specification and extracts endpoint metadata.',
        state: 'pending',
        durationMs: 2000,
        kind: 'llm'
      },
      {
        id: 'oas-authoring',
        name: 'OAS Authoring Agent',
        description: 'Synthesises a draft OpenAPI 3.1 contract from the parsed interface.',
        state: 'pending',
        durationMs: 2800,
        kind: 'llm'
      },
      {
        id: 'oas-quality',
        name: 'OAS Quality Agent',
        description: 'Validates OAS against Enterprise Integration schema guardrails and style rules.',
        state: 'pending',
        durationMs: 1800,
        kind: 'deterministic'
      }
    ],
    artifactIds: [
      'interface-summary.md',
      'payments-api.yaml',
      'oas-validation-report.json'
    ]
  },
  {
    id: 'build-generation',
    index: 2,
    name: 'Build Generation',
    shortName: 'Build Gen',
    description: 'Scaffold the Spring Boot service from archetype, generate implementation and push to GitLab.',
    state: 'pending',
    progress: 0,
    agents: [
      {
        id: 'archetype-template',
        name: 'Archetype Template Agent',
        description: 'Selects and materialises the Enterprise Integration Spring Boot archetype.',
        state: 'pending',
        durationMs: 1800,
        kind: 'deterministic'
      },
      {
        id: 'implementation',
        name: 'Implementation Agent',
        description: 'Generates controllers, services, DTOs and unit tests for each endpoint.',
        state: 'pending',
        durationMs: 3200,
        kind: 'deterministic'
      },
      {
        id: 'gitlab-simulation',
        name: 'GitLab Simulation Agent',
        description: 'Commits to feature branch, opens MR, publishes CI pipeline YAML.',
        state: 'pending',
        durationMs: 2200,
        kind: 'deterministic'
      }
    ],
    artifactIds: [
      'repo-tree.txt',
      'PaymentsController.java',
      'PaymentsControllerTest.java',
      'gitlab-ci.yml',
      'commit-history.txt'
    ]
  },
  {
    id: 'dev-validation',
    index: 3,
    name: 'Development Validation',
    shortName: 'Dev Validation',
    description: 'Compile, test and run quality + security gates before promotion.',
    state: 'pending',
    progress: 0,
    agents: [
      {
        id: 'local-build',
        name: 'Local Build Agent',
        description: 'Executes Gradle build against the generated workspace.',
        state: 'pending',
        durationMs: 2400,
        kind: 'deterministic'
      },
      {
        id: 'regression-test',
        name: 'Regression Test Agent',
        description: 'Runs unit + regression suites and collates coverage.',
        state: 'pending',
        durationMs: 3000,
        kind: 'deterministic'
      },
      {
        id: 'quality-gate',
        name: 'Quality Gate Agent',
        description: 'Applies SonarQube-style quality gate to the generated service.',
        state: 'pending',
        durationMs: 1800,
        kind: 'deterministic'
      },
      {
        id: 'security-assessment',
        name: 'Security Assessment Agent',
        description: 'Runs SAST + SCA against the service and flags HIGH+ findings.',
        state: 'pending',
        durationMs: 2400,
        kind: 'deterministic'
      }
    ],
    artifactIds: [
      'build.log',
      'test-summary.json',
      'sonar-report.json',
      'security-report.json'
    ]
  },
  {
    id: 'ai-governance-eval',
    index: 4,
    name: 'AI Governance & Evals',
    shortName: 'AI Evals',
    description: 'Evaluate AI-generated output against organisation governance, policy and engineering guidelines.',
    state: 'pending',
    progress: 0,
    agents: [
      {
        id: 'governance-eval',
        name: 'AI Output Eval Agent',
        description: 'Scores AI-generated code on style conformance, hallucination risk and spec fidelity.',
        state: 'pending',
        durationMs: 2200,
        kind: 'hybrid'
      },
      {
        id: 'policy-check',
        name: 'Governance Policy Agent',
        description: 'Checks ADR alignment, license allowlist, PII handling and forbidden-pattern rules.',
        state: 'pending',
        durationMs: 1800,
        kind: 'deterministic'
      }
    ],
    artifactIds: [
      'governance-eval-report.json',
      'policy-check.json'
    ]
  },
  {
    id: 'mr-validation',
    index: 5,
    name: 'Merge Request Validation',
    shortName: 'MR Validation',
    description: 'Run shared-branch CI against the merge-result commit, then squash-merge to main on green.',
    state: 'pending',
    progress: 0,
    agents: [
      {
        id: 'mr-pipeline',
        name: 'MR Pipeline Agent',
        description: 'Runs the full GitLab CI pipeline against the merge-result ref on feature/payments-reconciliation-v1.',
        state: 'pending',
        durationMs: 3200,
        kind: 'deterministic'
      },
      {
        id: 'mergeability-check',
        name: 'Mergeability Agent',
        description: 'Verifies no conflicts, required approvals present, protected-branch rules satisfied.',
        state: 'pending',
        durationMs: 1600,
        kind: 'deterministic'
      },
      {
        id: 'main-merge',
        name: 'Main Branch Merge Agent',
        description: 'Squash-merges to main with conventional-commit message and tags the release candidate.',
        state: 'pending',
        durationMs: 1800,
        kind: 'deterministic'
      }
    ],
    artifactIds: [
      'mr-pipeline-report.json',
      'mergeability-check.json',
      'merge-commit.txt'
    ]
  },
  {
    id: 'sit',
    index: 6,
    name: 'System Integration Test',
    shortName: 'SIT',
    description: 'Deploy to SIT, run smoke + integration tests against partner sandboxes.',
    state: 'pending',
    progress: 0,
    agents: [
      {
        id: 'sit-deploy',
        name: 'SIT Deploy Agent',
        description: 'Deploys build artefact to the SIT Kubernetes namespace.',
        state: 'pending',
        durationMs: 2600,
        kind: 'deterministic'
      },
      {
        id: 'smoke-test',
        name: 'Smoke Test Agent',
        description: 'Runs health, auth and golden-path probes against the live SIT service.',
        state: 'pending',
        durationMs: 2200,
        kind: 'deterministic'
      },
      {
        id: 'integration-coordination',
        name: 'Integration Coordination Agent',
        description: 'Orchestrates end-to-end integration tests across Enterprise Integration partners.',
        state: 'pending',
        durationMs: 2000,
        kind: 'deterministic'
      }
    ],
    artifactIds: [
      'sit-deployment.json',
      'smoke-test-results.json',
      'integration-report.json'
    ]
  },
  {
    id: 'staging',
    index: 7,
    name: 'Staging / Pre-Prod',
    shortName: 'Pre-Prod',
    description: 'Promote to pre-prod, confirm release readiness, draft release notes.',
    state: 'pending',
    progress: 0,
    agents: [
      {
        id: 'preprod-deploy',
        name: 'Pre-Prod Deploy Agent',
        description: 'Deploys to pre-prod with blue/green strategy; runs canary probes.',
        state: 'pending',
        durationMs: 2600,
        kind: 'deterministic'
      },
      {
        id: 'release-readiness',
        name: 'Release Readiness Agent',
        description: 'Audits checklist, signs off gates, drafts stakeholder release notes.',
        state: 'pending',
        durationMs: 2000,
        kind: 'hybrid'
      }
    ],
    artifactIds: [
      'preprod-deployment.json',
      'readiness-checklist.json',
      'release-notes-draft.md'
    ]
  },
  {
    id: 'production-pack',
    index: 8,
    name: 'Production Release Pack',
    shortName: 'Release Pack',
    description: 'Compile deployment manifest, rollback plan and approval pack for human gate.',
    state: 'pending',
    progress: 0,
    agents: [
      {
        id: 'production-approval',
        name: 'Production Approval Agent',
        description: 'Assembles the final approval pack and raises the production gate.',
        state: 'pending',
        durationMs: 2200,
        kind: 'hybrid'
      }
    ],
    artifactIds: [
      'deployment-manifest.yaml',
      'rollback-plan.md',
      'test-evidence-pack.json',
      'quality-summary.json',
      'security-summary.json',
      'final-approval-pack.md'
    ]
  }
];

export const TOTAL_STAGES = STAGE_DEFINITIONS.length;

export function cloneStages(): Stage[] {
  return STAGE_DEFINITIONS.map(s => ({
    ...s,
    progress: 0,
    state: 'pending' as const,
    agents: s.agents.map(a => ({
      ...a,
      state: 'pending' as const,
      startedAt: undefined,
      completedAt: undefined,
      failureMessage: undefined
    }))
  }));
}
