export type RunState =
  | 'idle'
  | 'ready'
  | 'running'
  | 'paused'
  | 'failed'
  | 'resumable'
  | 'awaiting-preprod-approval'
  | 'awaiting-approval'
  | 'deploying-prod'
  | 'deployed'
  | 'completed';

export type NodeState =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'paused'
  | 'resumable';

export type ArtifactType =
  | 'yaml'
  | 'json'
  | 'markdown'
  | 'java'
  | 'log'
  | 'text';

export type Severity = 'info' | 'success' | 'warning' | 'error' | 'milestone';

export type AgentExecutionKind = 'llm' | 'deterministic' | 'hybrid';

export interface AgentTask {
  id: string;
  name: string;
  description: string;
  state: NodeState;
  durationMs: number;
  kind: AgentExecutionKind;
  startedAt?: number;
  completedAt?: number;
  failureMessage?: string;
}

export interface Artifact {
  id: string;
  stageId: string;
  name: string;
  type: ArtifactType;
  description: string;
  content: string;
}

export interface Stage {
  id: string;
  index: number;
  name: string;
  shortName: string;
  description: string;
  state: NodeState;
  progress: number;
  agents: AgentTask[];
  artifactIds: string[];
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  stageId?: string;
  agentId?: string;
  message: string;
  severity: Severity;
}

export type ScenarioId =
  | 'happy-path'
  | 'oas-validation-failure'
  | 'security-gate-failure'
  | 'sit-integration-failure'
  | 'manual-pause-demo';

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  failureStageId?: string;
  failureAgentId?: string;
  failureMessage?: string;
  fixNarrative?: string;
}

export interface WorkflowRun {
  scenarioId: ScenarioId;
  state: RunState;
  currentStageIndex: number;
  checkpointStageIndex: number | null;
  startedAt?: number;
  pausedAt?: number;
  pausedElapsedMs: number;
  completedAt?: number;
  failureNotice?: string;
  failureResolved?: boolean;
}

export type TabId =
  | 'journal'
  | 'artifacts'
  | 'logs'
  | 'release-pack'
  | 'scenario';
