import type { Scenario, ScenarioId } from '@/types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'happy-path',
    name: 'Happy Path',
    description:
      'Full clean run through all nine stages to the production approval gate. Recommended for a first look at the end-to-end flow.'
  },
  {
    id: 'oas-validation-failure',
    name: 'OAS Validation Failure',
    description:
      'The OAS Quality Agent detects three schema violations and halts the run. Demonstrates the fix + resume flow from the earliest checkpoint.',
    failureStageId: 'spec-ingestion',
    failureAgentId: 'oas-quality',
    failureMessage:
      '3 schema validation errors detected in payments-api.yaml: missing 401 response on POST /payments, undefined $ref #/components/schemas/Refund, inconsistent operationId casing.',
    fixNarrative:
      'Auto-corrected 3 schema issues: added missing 401 responses, resolved $ref, normalised operationId casing.'
  },
  {
    id: 'security-gate-failure',
    name: 'Security Gate Failure',
    description:
      'The Security Assessment Agent surfaces two HIGH-severity findings during dev validation. Demonstrates gate failure deep in the pipeline.',
    failureStageId: 'dev-validation',
    failureAgentId: 'security-assessment',
    failureMessage:
      '2 HIGH-severity findings: CVE-2024-1234 in jackson-databind 2.15.2, hardcoded credential pattern in PaymentsService.java:142.',
    fixNarrative:
      'Bumped jackson-databind to 2.16.1, removed hardcoded credential and re-bound to Vault secret reference.'
  },
  {
    id: 'sit-integration-failure',
    name: 'SIT Integration Failure',
    description:
      'Integration coordination fails against a partner sandbox during SIT. Demonstrates recovery after real partner-side issues.',
    failureStageId: 'sit',
    failureAgentId: 'integration-coordination',
    failureMessage:
      '4 of 27 integration tests failed against partner sandbox: timeout on /reconciliations batch flow, schema drift on RefundEvent.',
    fixNarrative:
      'Adjusted batch timeout to 30s, regenerated RefundEvent contract from latest partner schema.'
  },
  {
    id: 'manual-pause-demo',
    name: 'Manual Pause / Resume Demo',
    description:
      'Same happy-path run — operator pauses mid-flight and resumes to demonstrate fine-grained operational control.'
  }
];

export const SCENARIO_BY_ID: Record<ScenarioId, Scenario> = Object.fromEntries(
  SCENARIOS.map(s => [s.id, s])
) as Record<ScenarioId, Scenario>;
