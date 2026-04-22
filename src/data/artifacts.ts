import type { Artifact } from '@/types';

const A = (a: Artifact) => a;

export const ARTIFACTS: Record<string, Artifact> = Object.fromEntries(
  [
    // Stage 1 — Spec & Contract
    A({
      id: 'interface-summary.md',
      stageId: 'spec-ingestion',
      name: 'interface-summary.md',
      type: 'markdown',
      description: 'Parsed interface summary',
      content: `# Parsed Interface Summary

**Source:** Payments_Reconciliation_Interface_v2.4.docx
**Domain:** Enterprise Integration — Payments & Reconciliation
**Inferred Endpoints:** 5
**Authentication:** OAuth 2.0 (client_credentials) + mTLS (partner channel)

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /payments | Submit a payment instruction |
| GET  | /payments/{id} | Retrieve payment status |
| POST | /reconciliations | Trigger a batch reconciliation job |
| POST | /refunds | Issue a refund against a settled payment |
| GET  | /health | Liveness + partner channel heartbeat |

## Data Objects
- \`PaymentInstruction\` — amount, currency, partnerRef, settlementDate
- \`PaymentStatus\` — state machine (RECEIVED → VALIDATED → SETTLED)
- \`ReconciliationBatch\` — window, counterparty, expectedCount
- \`RefundEvent\` — originPaymentId, reason, amount

## Non-Functional Requirements (inferred)
- p95 latency < 250 ms on /payments
- 99.95% availability SLO during business hours
- All traffic audited to Enterprise Audit Log v3
- PII tokenisation via Enterprise Token Broker
`
    }),
    A({
      id: 'payments-api.yaml',
      stageId: 'spec-ingestion',
      name: 'payments-api.yaml',
      type: 'yaml',
      description: 'Generated OpenAPI 3.1 contract',
      content: `openapi: 3.1.0
info:
  title: Payments Reconciliation API
  version: 1.0.0
  description: Enterprise Integration-aligned payments and reconciliation service.
  contact:
    name: Platform Engineering
servers:
  - url: https://api.enterprise.platform/payments/v1
    description: Production
  - url: https://sit.enterprise.platform/payments/v1
    description: SIT
security:
  - oauth2: [payments.write, payments.read]
paths:
  /payments:
    post:
      operationId: submitPayment
      summary: Submit a payment instruction
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentInstruction'
      responses:
        '202':
          description: Accepted for processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentAccepted'
        '400': { $ref: '#/components/responses/BadRequest' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '422': { $ref: '#/components/responses/Unprocessable' }
  /payments/{id}:
    get:
      operationId: getPaymentStatus
      summary: Retrieve payment status
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentStatus'
        '404': { $ref: '#/components/responses/NotFound' }
  /reconciliations:
    post:
      operationId: triggerReconciliation
      summary: Trigger a batch reconciliation job
      responses:
        '202': { description: Accepted }
  /refunds:
    post:
      operationId: issueRefund
      summary: Issue a refund against a settled payment
      responses:
        '202': { description: Accepted }
  /health:
    get:
      operationId: getHealth
      summary: Liveness + partner channel heartbeat
      responses:
        '200': { description: Healthy }
components:
  securitySchemes:
    oauth2:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: https://auth.enterprise.platform/oauth2/token
          scopes:
            payments.read: Read payments
            payments.write: Submit payments
  schemas:
    PaymentInstruction:
      type: object
      required: [amount, currency, partnerRef]
      properties:
        amount: { type: number, format: decimal, minimum: 0.01 }
        currency: { type: string, pattern: '^[A-Z]{3}$' }
        partnerRef: { type: string, maxLength: 64 }
        settlementDate: { type: string, format: date }
    PaymentAccepted:
      type: object
      properties:
        id: { type: string, format: uuid }
        status: { type: string, enum: [RECEIVED] }
    PaymentStatus:
      type: object
      properties:
        id: { type: string, format: uuid }
        state:
          type: string
          enum: [RECEIVED, VALIDATED, SETTLED, FAILED]
        updatedAt: { type: string, format: date-time }
  responses:
    BadRequest:    { description: Malformed request }
    Unauthorized:  { description: Missing or invalid credentials }
    NotFound:      { description: Resource not found }
    Unprocessable: { description: Semantic validation failed }
`
    }),
    A({
      id: 'oas-validation-report.json',
      stageId: 'spec-ingestion',
      name: 'oas-validation-report.json',
      type: 'json',
      description: 'OAS validation report',
      content: `{
  "linter": "oas-guardrails",
  "ruleset": "enterprise-platform-2.1",
  "target": "payments-api.yaml",
  "summary": {
    "errors": 0,
    "warnings": 1,
    "infos": 4,
    "rulesEvaluated": 47
  },
  "findings": [
    {
      "level": "warning",
      "rule": "platform-response-example",
      "path": "paths./payments.post.responses.202",
      "message": "Response is missing example payload (advisory)."
    },
    {
      "level": "info",
      "rule": "platform-operationid-casing",
      "path": "paths.*",
      "message": "All operationIds conform to lowerCamelCase."
    }
  ]
}
`
    }),

    // Stage 2 — Build Generation
    A({
      id: 'repo-tree.txt',
      stageId: 'build-generation',
      name: 'repo-tree.txt',
      type: 'text',
      description: 'Generated repository layout',
      content: `payments-reconciliation/
├── build.gradle.kts
├── settings.gradle.kts
├── .gitlab-ci.yml
├── Dockerfile
├── helm/
│   └── payments-reconciliation/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── values-sit.yaml
├── src/
│   ├── main/
│   │   ├── java/com/enterprise/platform/payments/
│   │   │   ├── PaymentsApplication.java
│   │   │   ├── api/
│   │   │   │   ├── PaymentsController.java
│   │   │   │   ├── ReconciliationController.java
│   │   │   │   └── RefundController.java
│   │   │   ├── domain/
│   │   │   │   ├── PaymentInstruction.java
│   │   │   │   ├── PaymentStatus.java
│   │   │   │   └── RefundEvent.java
│   │   │   ├── service/
│   │   │   │   └── PaymentsService.java
│   │   │   └── config/
│   │   │       └── SecurityConfig.java
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── openapi/payments-api.yaml
│   └── test/
│       └── java/com/enterprise/platform/payments/
│           ├── PaymentsControllerTest.java
│           ├── PaymentsServiceTest.java
│           └── contract/PaymentsContractTest.java
└── README.md
`
    }),
    A({
      id: 'PaymentsController.java',
      stageId: 'build-generation',
      name: 'PaymentsController.java',
      type: 'java',
      description: 'Generated REST controller',
      content: `package com.enterprise.platform.payments.api;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.enterprise.platform.payments.domain.PaymentInstruction;
import com.enterprise.platform.payments.domain.PaymentStatus;
import com.enterprise.platform.payments.service.PaymentsService;

import java.util.UUID;

@RestController
@RequestMapping("/payments")
public class PaymentsController {

  private final PaymentsService payments;

  public PaymentsController(PaymentsService payments) {
    this.payments = payments;
  }

  @PostMapping
  @PreAuthorize("hasAuthority('SCOPE_payments.write')")
  public ResponseEntity<PaymentStatus> submit(@Valid @RequestBody PaymentInstruction body) {
    PaymentStatus accepted = payments.submit(body);
    return ResponseEntity.accepted().body(accepted);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('SCOPE_payments.read')")
  public ResponseEntity<PaymentStatus> status(@PathVariable UUID id) {
    return payments.status(id)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }
}
`
    }),
    A({
      id: 'PaymentsControllerTest.java',
      stageId: 'build-generation',
      name: 'PaymentsControllerTest.java',
      type: 'java',
      description: 'Generated MockMvc test',
      content: `package com.enterprise.platform.payments.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import com.enterprise.platform.payments.service.PaymentsService;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentsController.class)
class PaymentsControllerTest {

  @Autowired MockMvc mvc;
  @MockBean PaymentsService payments;

  @Test
  void submit_returns_202_for_valid_body() throws Exception {
    mvc.perform(post("/payments")
            .contentType("application/json")
            .content("""
              { "amount": 1200.00, "currency": "GBP", "partnerRef": "PRT-001" }
            """))
        .andExpect(status().isAccepted());
    verify(payments).submit(any());
  }

  @Test
  void submit_returns_400_for_missing_currency() throws Exception {
    mvc.perform(post("/payments")
            .contentType("application/json")
            .content("""
              { "amount": 1200.00, "partnerRef": "PRT-001" }
            """))
        .andExpect(status().isBadRequest());
  }
}
`
    }),
    A({
      id: 'gitlab-ci.yml',
      stageId: 'build-generation',
      name: '.gitlab-ci.yml',
      type: 'yaml',
      description: 'Generated GitLab CI pipeline',
      content: `stages: [validate, build, test, quality, security, package, deploy-sit, deploy-preprod, release]

variables:
  GRADLE_OPTS: "-Dorg.gradle.daemon=false"

validate-oas:
  stage: validate
  script:
    - oas-guardrails lint src/main/resources/openapi/payments-api.yaml

build:
  stage: build
  script: [./gradlew clean assemble]
  artifacts:
    paths: [build/libs/*.jar]

unit-test:
  stage: test
  script: [./gradlew test]
  coverage: '/TOTAL.*\\s+([0-9]{1,3}%)/'

quality-gate:
  stage: quality
  script: [./gradlew sonar]

security-scan:
  stage: security
  script:
    - platform-sast scan .
    - platform-sca scan build.gradle.kts

package:
  stage: package
  script:
    - docker build -t platform/payments:\${CI_COMMIT_SHORT_SHA} .
    - docker push platform/payments:\${CI_COMMIT_SHORT_SHA}

deploy-sit:
  stage: deploy-sit
  environment: sit
  script:
    - helm upgrade --install payments helm/payments-reconciliation -f helm/payments-reconciliation/values-sit.yaml

deploy-preprod:
  stage: deploy-preprod
  environment: preprod
  when: manual
  script: [helm upgrade --install payments helm/payments-reconciliation]

release-pack:
  stage: release
  script: [platform-release pack]
`
    }),
    A({
      id: 'commit-history.txt',
      stageId: 'build-generation',
      name: 'commit-history.txt',
      type: 'log',
      description: 'Mock commit history',
      content: `* 8f3a1c2 (HEAD -> feature/payments-reconciliation-v1) ci: add release pack stage
* 47d9a0e feat(security): enable OAuth2 resource server + scope-based authz
* 2b1f88d test(payments): MockMvc coverage for /payments submit + status
* a0c4e12 feat(payments): implement PaymentsService with state machine
* 514b337 feat(api): scaffold controllers from OAS (submitPayment, getPaymentStatus)
* e72e90a chore: generate Spring Boot 3.3 project from enterprise-spring-archetype@4.2.1
* f10acd5 docs: add parsed interface summary to repo
* c001001 chore: initial commit
`
    }),

    // Stage 3 — Dev Validation
    A({
      id: 'build.log',
      stageId: 'dev-validation',
      name: 'build.log',
      type: 'log',
      description: 'Gradle build log (tail)',
      content: `> Task :compileJava
> Task :processResources
> Task :classes
> Task :bootJar
> Task :assemble
> Task :compileTestJava
> Task :processTestResources NO-SOURCE
> Task :testClasses
> Task :test

PaymentsControllerTest > submit_returns_202_for_valid_body() PASSED
PaymentsControllerTest > submit_returns_400_for_missing_currency() PASSED
PaymentsServiceTest > transitions_to_VALIDATED_on_success() PASSED
PaymentsServiceTest > emits_audit_event_on_settlement() PASSED
PaymentsContractTest > matches_published_oas_contract() PASSED

> Task :check
> Task :build

BUILD SUCCESSFUL in 42s
17 actionable tasks: 17 executed
`
    }),
    A({
      id: 'test-summary.json',
      stageId: 'dev-validation',
      name: 'test-summary.json',
      type: 'json',
      description: 'Unit + regression summary',
      content: `{
  "total": 147,
  "passed": 147,
  "failed": 0,
  "skipped": 0,
  "durationSec": 41.8,
  "coverage": {
    "lines": 0.912,
    "branches": 0.864,
    "methods": 0.94
  },
  "suites": [
    { "name": "PaymentsControllerTest", "passed": 12, "failed": 0 },
    { "name": "PaymentsServiceTest", "passed": 34, "failed": 0 },
    { "name": "ReconciliationFlowTest", "passed": 29, "failed": 0 },
    { "name": "RefundEventTest", "passed": 22, "failed": 0 },
    { "name": "PaymentsContractTest", "passed": 50, "failed": 0 }
  ]
}
`
    }),
    A({
      id: 'sonar-report.json',
      stageId: 'dev-validation',
      name: 'sonar-report.json',
      type: 'json',
      description: 'SonarQube-style quality report',
      content: `{
  "qualityGate": "PASSED",
  "project": "payments-reconciliation",
  "metrics": {
    "bugs": 0,
    "vulnerabilities": 0,
    "codeSmells": 4,
    "duplicatedLinesDensity": 0.9,
    "coverage": 91.2,
    "maintainabilityRating": "A",
    "reliabilityRating": "A",
    "securityRating": "A"
  },
  "codeSmells": [
    { "rule": "java:S1192", "file": "PaymentsService.java", "line": 88, "msg": "Define a constant instead of literal 'GBP'." },
    { "rule": "java:S1135", "file": "RefundService.java", "line": 34, "msg": "TODO comment — plan resolution." },
    { "rule": "java:S3776", "file": "ReconciliationService.java", "line": 120, "msg": "Cognitive complexity 16 > 15." },
    { "rule": "java:S1128", "file": "HealthController.java", "line": 3, "msg": "Unused import." }
  ]
}
`
    }),
    A({
      id: 'security-report.json',
      stageId: 'dev-validation',
      name: 'security-report.json',
      type: 'json',
      description: 'SAST + SCA security report',
      content: `{
  "gate": "PASS",
  "scanners": ["platform-sast@3.4.0", "platform-sca@2.9.1"],
  "findings": {
    "critical": 0,
    "high": 0,
    "medium": 1,
    "low": 3,
    "info": 12
  },
  "medium": [
    {
      "id": "CWE-352",
      "scanner": "platform-sast",
      "file": "SecurityConfig.java",
      "line": 48,
      "message": "CSRF token check is disabled on actuator endpoints. Acceptable for internal mgmt — annotate to suppress."
    }
  ],
  "sbom": {
    "components": 142,
    "provenanceAttested": true
  }
}
`
    }),

    // Stage 4 — AI Governance & Evals
    A({
      id: 'governance-eval-report.json',
      stageId: 'ai-governance-eval',
      name: 'governance-eval-report.json',
      type: 'json',
      description: 'AI output eval scorecard',
      content: `{
  "evalHarness": "platform-ai-evals@2.4.0",
  "modelRef": "claude-opus-4-7",
  "targetArtifacts": ["PaymentsController.java", "PaymentsService.java", "payments-api.yaml"],
  "scorecard": {
    "overall": 96,
    "dimensions": {
      "styleConformance":   { "score": 98, "rubric": "platform Java style guide v7.2" },
      "specFidelity":       { "score": 98, "notes": "Generated endpoints match OAS 3.1 contract 1:1" },
      "hallucinationRisk":  { "score": "LOW", "evidence": "0 references to non-existent types/APIs" },
      "determinism":        { "score": 94, "notes": "Re-run diff < 2% (doc comments only)" },
      "testCoverageClaim":  { "score": "VERIFIED", "claimed": 0.912, "measured": 0.912 }
    }
  },
  "redTeamProbes": {
    "run": 42,
    "passed": 42,
    "categories": ["prompt-injection", "jailbreak", "overclaim", "unsafe-code-gen"]
  },
  "humanReviewRequired": false,
  "verdict": "PASS"
}
`
    }),
    A({
      id: 'policy-check.json',
      stageId: 'ai-governance-eval',
      name: 'policy-check.json',
      type: 'json',
      description: 'Organisation governance policy check',
      content: `{
  "policyBundle": "enterprise-platform-policies@1.18.0",
  "checks": [
    { "id": "ADR-014", "name": "No raw SQL outside repository layer",          "status": "pass" },
    { "id": "ADR-021", "name": "All inbound traffic must traverse API gateway","status": "pass" },
    { "id": "ADR-033", "name": "Payments must emit audit event per transition","status": "pass" },
    { "id": "ADR-041", "name": "No PII in log statements",                     "status": "pass" },
    { "id": "ADR-052", "name": "External calls via resilient-client wrapper",  "status": "pass" },
    { "id": "SEC-007", "name": "Secrets must be resolved via Vault broker",    "status": "pass" },
    { "id": "LIC-002", "name": "All deps on approved license allowlist",       "status": "pass", "scanned": 142 }
  ],
  "forbiddenPatterns": {
    "scanned": ["System.out.println", "TODO:", "@SuppressWarnings(\\"all\\")", "new Random()"],
    "hits": 0
  },
  "licenseAllowlist": ["Apache-2.0", "MIT", "BSD-3-Clause", "EPL-2.0"],
  "disallowedLicenseHits": 0,
  "owners": ["platform-governance@enterprise", "security-architecture@enterprise"],
  "verdict": "PASS"
}
`
    }),

    // Stage 5 — MR Validation
    A({
      id: 'mr-pipeline-report.json',
      stageId: 'mr-validation',
      name: 'mr-pipeline-report.json',
      type: 'json',
      description: 'GitLab CI pipeline result on merge-result ref',
      content: `{
  "projectPath": "enterprise-integration/payments-reconciliation-api",
  "mergeRequestIid": 147,
  "sourceBranch": "feature/payments-reconciliation-v1",
  "targetBranch": "main",
  "pipelineId": 982341,
  "ref": "refs/merge-requests/147/merge",
  "mergeResultCommit": "7a3f1c9e4b2d5a81",
  "status": "success",
  "durationSec": 161,
  "stages": [
    { "name": "validate",   "status": "success", "durationSec":  8 },
    { "name": "build",      "status": "success", "durationSec": 34 },
    { "name": "unit-test",  "status": "success", "durationSec": 22 },
    { "name": "contract",   "status": "success", "durationSec": 14 },
    { "name": "quality",    "status": "success", "durationSec": 18 },
    { "name": "security",   "status": "success", "durationSec": 26 },
    { "name": "package",    "status": "success", "durationSec": 19 },
    { "name": "publish",    "status": "success", "durationSec": 12 },
    { "name": "notify",     "status": "success", "durationSec":  8 }
  ],
  "coverage": { "line": 0.912, "branch": 0.874 },
  "artifactsPublished": ["payments-0.1.0-rc1.jar", "sbom.spdx.json"]
}
`
    }),
    A({
      id: 'mergeability-check.json',
      stageId: 'mr-validation',
      name: 'mergeability-check.json',
      type: 'json',
      description: 'Protected-branch and approval gate check',
      content: `{
  "mergeRequestIid": 147,
  "mergeable": true,
  "conflicts": [],
  "protectedBranchRules": {
    "branch": "main",
    "pushAllowed": false,
    "mergeAllowed": ["maintainers"],
    "forcePushAllowed": false,
    "requireSignedCommits": true
  },
  "approvals": {
    "required": 2,
    "given": 2,
    "approvers": ["alex.morgan@platform", "priya.rao@platform"]
  },
  "requiredChecks": [
    { "name": "ci/pipeline",        "status": "success" },
    { "name": "security/sast",      "status": "success" },
    { "name": "security/sca",       "status": "success" },
    { "name": "quality/sonar-gate", "status": "success" },
    { "name": "contract/oas-lint",  "status": "success" }
  ],
  "blockers": []
}
`
    }),
    A({
      id: 'merge-commit.txt',
      stageId: 'mr-validation',
      name: 'merge-commit.txt',
      type: 'text',
      description: 'Squash-merge commit on main',
      content: `commit 7a3f1c9e4b2d5a81f03c9d6b4a27e180f9c12ab34 (HEAD -> main, tag: rc-v1.0.0-rc.1)
Author:  Platform CI <ci@enterprise.platform>
Date:    Wed Apr 22 10:42:18 2026 +0100
Merge:   squash of !147 (feature/payments-reconciliation-v1 → main)

    feat(payments): payments reconciliation API v1.0.0-rc.1

    - Generated from payments-api.yaml (OAS 3.1)
    - Adds /payments, /payments/{id}, /reconciliations, /refunds, /health
    - OAuth 2.0 + mTLS partner channel
    - 147 unit tests, 91.2% line coverage
    - SBOM attested (142 components), 0 HIGH+ CVEs

    Co-authored-by: Alex Morgan <alex.morgan@platform>
    Co-authored-by: Priya Rao   <priya.rao@platform>
    Closes: !147
    Release-Candidate: rc-v1.0.0-rc.1
`
    }),

    // Stage 6 — SIT
    A({
      id: 'sit-deployment.json',
      stageId: 'sit',
      name: 'sit-deployment.json',
      type: 'json',
      description: 'SIT deployment summary',
      content: `{
  "environment": "sit",
  "namespace": "payments-sit",
  "release": "payments-reconciliation-1.0.0-rc.1",
  "strategy": "rolling",
  "status": "READY",
  "replicas": { "desired": 3, "ready": 3 },
  "image": "registry.enterprise.platform/payments:8f3a1c2",
  "rolloutDurationSec": 38,
  "probes": {
    "liveness": "200 OK",
    "readiness": "200 OK"
  }
}
`
    }),
    A({
      id: 'smoke-test-results.json',
      stageId: 'sit',
      name: 'smoke-test-results.json',
      type: 'json',
      description: 'Post-deploy smoke probe results',
      content: `{
  "probes": [
    { "name": "GET /health",                    "status": 200, "ms": 14 },
    { "name": "POST /payments (golden path)",   "status": 202, "ms": 91 },
    { "name": "GET /payments/{id}",             "status": 200, "ms": 22 },
    { "name": "POST /reconciliations",          "status": 202, "ms": 76 },
    { "name": "AuthZ — missing scope = 403",    "status": 403, "ms": 12 }
  ],
  "all_passed": true
}
`
    }),
    A({
      id: 'integration-report.json',
      stageId: 'sit',
      name: 'integration-report.json',
      type: 'json',
      description: 'End-to-end integration test report',
      content: `{
  "suite": "payments-e2e",
  "partners": ["BACS", "Faster Payments", "Settlement Broker"],
  "scenarios": {
    "total": 27,
    "passed": 27,
    "failed": 0,
    "durationMin": 6.4
  },
  "auditTrail": {
    "eventsEmitted": 214,
    "auditLogVersion": "v3"
  },
  "criticalPaths": [
    { "name": "payment submit → BACS settle → reconcile",  "status": "PASS" },
    { "name": "refund initiate → partner ack → audit",      "status": "PASS" },
    { "name": "batch reconciliation 10k rows",              "status": "PASS" }
  ]
}
`
    }),

    // Stage 7 — Pre-Prod
    A({
      id: 'preprod-deployment.json',
      stageId: 'staging',
      name: 'preprod-deployment.json',
      type: 'json',
      description: 'Pre-prod deployment summary',
      content: `{
  "environment": "preprod",
  "release": "payments-reconciliation-1.0.0",
  "strategy": "blue-green",
  "activeColor": "green",
  "canary": {
    "trafficShiftPct": 10,
    "durationMin": 15,
    "errorRate": 0.0,
    "p95Ms": 182
  },
  "status": "PROMOTED"
}
`
    }),
    A({
      id: 'readiness-checklist.json',
      stageId: 'staging',
      name: 'readiness-checklist.json',
      type: 'json',
      description: 'Release readiness checklist',
      content: `{
  "gates": [
    { "name": "Unit + regression tests",        "status": "PASS" },
    { "name": "Contract tests vs partners",     "status": "PASS" },
    { "name": "Quality gate (Sonar)",           "status": "PASS" },
    { "name": "Security scan (SAST + SCA)",     "status": "PASS" },
    { "name": "SIT sign-off",                   "status": "PASS" },
    { "name": "Canary analysis",                "status": "PASS" },
    { "name": "Runbook attached",               "status": "PASS" },
    { "name": "Rollback plan attached",         "status": "PASS" },
    { "name": "PII DPIA reviewed",              "status": "PASS" },
    { "name": "Change Advisory Board",          "status": "PENDING HUMAN APPROVAL" }
  ],
  "overall": "READY-FOR-CAB"
}
`
    }),
    A({
      id: 'release-notes-draft.md',
      stageId: 'staging',
      name: 'release-notes-draft.md',
      type: 'markdown',
      description: 'Draft release notes (stakeholder-facing)',
      content: `# Payments Reconciliation API — 1.0.0

**Status:** Ready for Production — Pending Human Approval
**Release Lead:** Platform Engineering
**Change Window:** Proposed 03:00–04:00 UTC

## Highlights
- First production release of the Payments Reconciliation API aligned to Enterprise Integration standards.
- Submits, retrieves and reconciles payment instructions against BACS and Faster Payments.
- Issues refunds with full audit lineage via Enterprise Audit Log v3.

## What's New
- 5 production endpoints covered by OAS 3.1 contract.
- OAuth 2.0 client_credentials + mTLS on partner channel.
- p95 latency 182 ms on canary (SLO target ≤ 250 ms).
- 91.2% line coverage, zero HIGH+ vulnerabilities.

## Rollout Plan
- Blue/green deploy with 10% canary for 15 minutes, then full cut-over.
- Rollback: flip active colour to \`blue\` (previous release); data plane is backward-compatible.

## Operational Readiness
- Runbook: \`runbooks/payments-reconciliation-v1.md\`
- Dashboard: \`grafana/payments\`
- On-call rota: Payments Team primary, Platform secondary.
`
    }),

    // Stage 8 — Release Pack
    A({
      id: 'deployment-manifest.yaml',
      stageId: 'production-pack',
      name: 'deployment-manifest.yaml',
      type: 'yaml',
      description: 'Production deployment manifest',
      content: `apiVersion: enterprise.platform/v1
kind: ReleaseManifest
metadata:
  name: payments-reconciliation
  version: 1.0.0
  releaseId: REL-2026-04-21-001
spec:
  service: payments-reconciliation
  environment: production
  image: registry.enterprise.platform/payments:8f3a1c2
  replicas: 6
  strategy:
    type: blueGreen
    canary: { trafficShiftPct: 10, windowMinutes: 15 }
  dependencies:
    - name: audit-log
      version: ">=3.0.0"
    - name: platform-token-broker
      version: ">=2.4.0"
  approvals:
    - role: Change Advisory Board
      status: PENDING
    - role: Product Owner
      status: PENDING
`
    }),
    A({
      id: 'rollback-plan.md',
      stageId: 'production-pack',
      name: 'rollback-plan.md',
      type: 'markdown',
      description: 'Rollback plan',
      content: `# Rollback Plan — Payments Reconciliation 1.0.0

## Trigger Criteria
- Error rate > 2% sustained for 2 minutes on /payments or /refunds
- p95 latency > 500 ms sustained for 5 minutes
- Any HIGH+ audit log drop detected by Enterprise Audit Log v3

## Procedure
1. **Freeze canary shift** — halt progressive delivery (GitOps flag \`payments.canary.halt=true\`).
2. **Flip active colour** — helm upgrade with \`activeColor=blue\` (previous release).
3. **Drain green** — wait 60s for in-flight requests to complete.
4. **Confirm rollback** — verify /health returns previous release version tag.
5. **Disable partner webhook** — Enterprise Token Broker isolates partner channel.

**Target rollback time:** < 4 minutes from trigger to blue fully active.

## Data Plane
- No destructive schema changes in this release.
- No backfill needed on rollback.
- Audit log records forward-compatible; older reader will ignore new fields.
`
    }),
    A({
      id: 'test-evidence-pack.json',
      stageId: 'production-pack',
      name: 'test-evidence-pack.json',
      type: 'json',
      description: 'Consolidated test evidence',
      content: `{
  "release": "1.0.0",
  "evidence": {
    "unit": { "passed": 147, "failed": 0, "coverage": 0.912 },
    "contract": { "passed": 50, "failed": 0 },
    "integration": { "passed": 27, "failed": 0 },
    "smoke": { "passed": 5, "failed": 0 },
    "canary": { "trafficPct": 10, "durationMin": 15, "errorRate": 0.0 }
  },
  "artefactReferences": [
    "test-summary.json",
    "smoke-test-results.json",
    "integration-report.json",
    "preprod-deployment.json"
  ]
}
`
    }),
    A({
      id: 'quality-summary.json',
      stageId: 'production-pack',
      name: 'quality-summary.json',
      type: 'json',
      description: 'Quality summary (roll-up)',
      content: `{
  "qualityGate": "PASSED",
  "coverage": 91.2,
  "maintainability": "A",
  "reliability": "A",
  "codeSmells": 4,
  "duplication": 0.9,
  "tradeoffs": [
    "1 medium finding accepted: actuator CSRF disabled (internal mgmt endpoints only)."
  ]
}
`
    }),
    A({
      id: 'security-summary.json',
      stageId: 'production-pack',
      name: 'security-summary.json',
      type: 'json',
      description: 'Security summary (roll-up)',
      content: `{
  "gate": "PASS",
  "scanners": ["platform-sast", "platform-sca", "platform-secret-scan"],
  "critical": 0,
  "high": 0,
  "medium": 1,
  "low": 3,
  "sbomComponents": 142,
  "provenanceAttested": true,
  "complianceControls": {
    "DPIA": "REVIEWED",
    "OWASP-ASVS-L2": "PASS",
    "NCSC-CAF-B3": "PASS"
  }
}
`
    }),
    A({
      id: 'final-approval-pack.md',
      stageId: 'production-pack',
      name: 'final-approval-pack.md',
      type: 'markdown',
      description: 'Final approval pack for CAB',
      content: `# Final Approval Pack — Payments Reconciliation 1.0.0

**Status:** READY FOR PRODUCTION — PENDING HUMAN APPROVAL

## Change Summary
First production release of the Payments Reconciliation API. 5 endpoints, Java 21 / Spring Boot 3.3, deployed via blue/green with 10% canary.

## Evidence Trail
- Contract: \`payments-api.yaml\` (OAS 3.1, 0 schema errors)
- Tests: 147 unit + 50 contract + 27 integration + 5 smoke = **229 passing**
- Quality: Sonar gate PASSED, 91.2% coverage, A/A/A ratings
- Security: SAST + SCA PASSED, 0 HIGH+ findings, SBOM attested
- Pre-prod canary: 15 min @ 10% traffic, 0.0% error rate, p95 = 182 ms

## Risk Assessment
- **Blast radius:** Partner payment flow (BACS, Faster Payments).
- **Data impact:** None — no schema changes.
- **Rollback:** < 4 minutes via blue/green flip.
- **Customer impact on rollback:** None.

## Required Sign-offs (not yet received)
- [ ] Change Advisory Board
- [ ] Product Owner — Payments Team
- [ ] Security & Compliance Officer

## Recommended Action
Raise for CAB review in the next change window (03:00–04:00 UTC). Technical readiness is confirmed; business approval is the only outstanding gate.

> **No automatic production deployment will occur. A human must explicitly approve this release.**
`
    })
  ].map(a => [a.id, a])
);
