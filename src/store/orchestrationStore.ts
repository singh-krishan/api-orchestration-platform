import { create } from 'zustand';
import type {
  Artifact,
  JournalEntry,
  NodeState,
  Scenario,
  ScenarioId,
  Stage,
  TabId,
  WorkflowRun
} from '@/types';
import { cloneStages } from '@/data/stages';
import { ARTIFACTS } from '@/data/artifacts';
import { SCENARIO_BY_ID } from '@/data/scenarios';

let journalIdCounter = 0;
const nextJournalId = () => `j-${Date.now().toString(36)}-${journalIdCounter++}`;

export interface OrchestrationStore {
  run: WorkflowRun;
  stages: Stage[];
  artifacts: Record<string, Artifact>;
  visibleArtifactIds: string[];
  journal: JournalEntry[];
  selectedStageId: string | null;
  selectedArtifactId: string | null;
  activeTab: TabId;
  uploadedFileName: string | null;
  scenarioId: ScenarioId;

  // Intake
  setUploadedFile: (name: string | null) => void;
  setScenario: (id: ScenarioId) => void;

  // Lifecycle
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  restartRun: () => void;
  markAwaitingApproval: () => void;
  markAwaitingPreprodApproval: () => void;
  approveAndDeployPreprod: () => void;
  approveAndDeployProd: () => void;
  completeProdDeploy: () => void;
  applyMockFix: () => void;
  prepareResumeFromCheckpoint: () => number; // returns fromIndex

  // Engine-driven
  setStageState: (stageId: string, state: NodeState) => void;
  setStageProgress: (stageId: string, progress: number) => void;
  setAgentState: (
    stageId: string,
    agentId: string,
    state: NodeState,
    failureMessage?: string
  ) => void;
  emitJournal: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  revealArtifacts: (stageId: string) => void;
  setCurrentStageIndex: (i: number) => void;
  setCheckpoint: (i: number | null) => void;
  failRun: (notice: string) => void;

  // UI
  selectStage: (id: string | null) => void;
  selectArtifact: (id: string | null) => void;
  setActiveTab: (tab: TabId) => void;
}

function initialRun(scenarioId: ScenarioId): WorkflowRun {
  return {
    scenarioId,
    state: 'idle',
    currentStageIndex: 0,
    checkpointStageIndex: null,
    pausedElapsedMs: 0
  };
}

export const useOrchestrationStore = create<OrchestrationStore>((set, get) => ({
  run: initialRun('happy-path'),
  stages: cloneStages(),
  artifacts: ARTIFACTS,
  visibleArtifactIds: [],
  journal: [],
  selectedStageId: null,
  selectedArtifactId: null,
  activeTab: 'journal',
  uploadedFileName: null,
  scenarioId: 'happy-path',

  setUploadedFile: name => set({ uploadedFileName: name }),

  setScenario: id => set({ scenarioId: id, run: { ...get().run, scenarioId: id } }),

  startRun: () => {
    const { scenarioId } = get();
    const now = Date.now();
    set({
      stages: cloneStages(),
      visibleArtifactIds: [],
      journal: [],
      selectedStageId: null,
      selectedArtifactId: null,
      activeTab: 'journal',
      run: {
        scenarioId,
        state: 'running',
        currentStageIndex: 0,
        checkpointStageIndex: null,
        pausedElapsedMs: 0,
        startedAt: now
      }
    });
    // First journal entry
    const scenario: Scenario = SCENARIO_BY_ID[scenarioId];
    get().emitJournal({
      severity: 'milestone',
      message: `Orchestration started — scenario: ${scenario.name}.`
    });
    // Stage 0 is intake — mark it complete immediately
    get().setStageState('intake', 'completed');
  },

  pauseRun: () => {
    const { run } = get();
    if (run.state !== 'running') return;
    set({ run: { ...run, state: 'paused', pausedAt: Date.now() } });
    get().emitJournal({
      severity: 'warning',
      message: 'Operator paused the orchestration. Current agent will hold safely.'
    });
  },

  resumeRun: () => {
    const { run } = get();
    if (run.state !== 'paused' || !run.pausedAt) return;
    const pauseDelta = Date.now() - run.pausedAt;
    set({
      run: {
        ...run,
        state: 'running',
        pausedAt: undefined,
        pausedElapsedMs: run.pausedElapsedMs + pauseDelta
      }
    });
    get().emitJournal({
      severity: 'info',
      message: 'Operator resumed the orchestration.'
    });
  },

  restartRun: () => {
    set({
      stages: cloneStages(),
      visibleArtifactIds: [],
      journal: [],
      selectedStageId: null,
      selectedArtifactId: null,
      run: initialRun(get().scenarioId)
    });
  },

  markAwaitingApproval: () => {
    const now = Date.now();
    set(state => ({
      run: { ...state.run, state: 'awaiting-approval', completedAt: now }
    }));
    get().emitJournal({
      severity: 'milestone',
      message: 'Ready for Production Deployment — Pending Human Approval.'
    });
  },

  markAwaitingPreprodApproval: () => {
    set(state => ({ run: { ...state.run, state: 'awaiting-preprod-approval' } }));
    get().emitJournal({
      severity: 'milestone',
      message: 'SIT complete — awaiting human approval to deploy to Pre-Prod.'
    });
  },

  approveAndDeployPreprod: () => {
    const { run } = get();
    if (run.state !== 'awaiting-preprod-approval') return;
    set({ run: { ...run, state: 'running' } });
    get().emitJournal({
      severity: 'milestone',
      message: 'Human approval granted — proceeding to Pre-Prod deployment.'
    });
  },

  approveAndDeployProd: () => {
    const { run } = get();
    if (run.state !== 'awaiting-approval') return;
    set({ run: { ...run, state: 'deploying-prod' } });
    get().emitJournal({
      severity: 'milestone',
      message: 'Human approval granted — deploying Payments Reconciliation API to Production.'
    });
  },

  completeProdDeploy: () => {
    set(s => ({ run: { ...s.run, state: 'deployed', completedAt: Date.now() } }));
    get().emitJournal({
      severity: 'milestone',
      message: 'Production deployment successful — service live, 3/3 replicas READY, canary healthy.'
    });
  },

  applyMockFix: () => {
    const { run, stages, scenarioId } = get();
    if (run.state !== 'failed') return;
    const scenario = SCENARIO_BY_ID[scenarioId];
    const failedStageId = scenario.failureStageId;
    const failedAgentId = scenario.failureAgentId;
    if (!failedStageId) return;

    const nextStages = stages.map(s => {
      if (s.id !== failedStageId) return s;
      return {
        ...s,
        state: 'resumable' as NodeState,
        agents: s.agents.map(a =>
          a.id === failedAgentId
            ? { ...a, state: 'resumable' as NodeState, failureMessage: undefined }
            : a
        )
      };
    });
    set({
      stages: nextStages,
      run: { ...run, state: 'resumable', failureNotice: undefined, failureResolved: true }
    });
    get().emitJournal({
      severity: 'success',
      message: `Mock fix applied: ${scenario.fixNarrative ?? 'issue auto-corrected.'}`
    });
  },

  prepareResumeFromCheckpoint: () => {
    const { run, stages, scenarioId } = get();
    const scenario = SCENARIO_BY_ID[scenarioId];
    const failedStageId = scenario.failureStageId;
    const fromIndex = failedStageId
      ? stages.findIndex(s => s.id === failedStageId)
      : (run.checkpointStageIndex ?? 0) + 1;

    // Reset the failed stage + all stages after it
    const nextStages = stages.map(s => {
      if (s.index < fromIndex) return s;
      return {
        ...s,
        state: 'pending' as NodeState,
        progress: 0,
        agents: s.agents.map(a => ({
          ...a,
          state: 'pending' as NodeState,
          startedAt: undefined,
          completedAt: undefined,
          failureMessage: undefined
        }))
      };
    });

    // Hide artifacts from stages we're re-running
    const nextVisible = get().visibleArtifactIds.filter(id => {
      const art = ARTIFACTS[id];
      if (!art) return false;
      const stage = stages.find(s => s.id === art.stageId);
      return !!stage && stage.index < fromIndex;
    });

    set({
      stages: nextStages,
      visibleArtifactIds: nextVisible,
      run: {
        ...run,
        state: 'running',
        currentStageIndex: fromIndex,
        pausedAt: undefined
      }
    });
    get().emitJournal({
      severity: 'milestone',
      message: `Resuming from checkpoint — restarting Stage ${fromIndex} onward.`
    });
    return fromIndex;
  },

  setStageState: (stageId, state) =>
    set(s => ({
      stages: s.stages.map(st => (st.id === stageId ? { ...st, state } : st))
    })),

  setStageProgress: (stageId, progress) =>
    set(s => ({
      stages: s.stages.map(st => (st.id === stageId ? { ...st, progress } : st))
    })),

  setAgentState: (stageId, agentId, state, failureMessage) =>
    set(s => ({
      stages: s.stages.map(st => {
        if (st.id !== stageId) return st;
        return {
          ...st,
          agents: st.agents.map(a => {
            if (a.id !== agentId) return a;
            const next = { ...a, state, failureMessage };
            if (state === 'running' && !next.startedAt) next.startedAt = Date.now();
            if (state === 'completed' || state === 'failed') next.completedAt = Date.now();
            return next;
          })
        };
      })
    })),

  emitJournal: entry =>
    set(s => ({
      journal: [
        ...s.journal,
        { id: nextJournalId(), timestamp: Date.now(), ...entry }
      ]
    })),

  revealArtifacts: stageId => {
    const stage = get().stages.find(s => s.id === stageId);
    if (!stage) return;
    set(s => ({
      visibleArtifactIds: Array.from(new Set([...s.visibleArtifactIds, ...stage.artifactIds]))
    }));
  },

  setCurrentStageIndex: i =>
    set(s => ({ run: { ...s.run, currentStageIndex: i } })),

  setCheckpoint: i =>
    set(s => ({ run: { ...s.run, checkpointStageIndex: i } })),

  failRun: notice =>
    set(s => ({
      run: { ...s.run, state: 'failed', failureNotice: notice }
    })),

  selectStage: id => set({ selectedStageId: id }),
  selectArtifact: id =>
    set({ selectedArtifactId: id, activeTab: id ? 'artifacts' : get().activeTab }),
  setActiveTab: tab => set({ activeTab: tab })
}));

// Selectors
export const selectElapsedMs = (s: OrchestrationStore): number => {
  const { startedAt, pausedElapsedMs, pausedAt, completedAt, state } = s.run;
  if (!startedAt) return 0;
  if (state === 'paused' && pausedAt) return pausedAt - startedAt - pausedElapsedMs;
  if (completedAt) return completedAt - startedAt - pausedElapsedMs;
  return Date.now() - startedAt - pausedElapsedMs;
};
