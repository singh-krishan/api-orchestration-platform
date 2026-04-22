import { useOrchestrationStore } from '@/store/orchestrationStore';
import { SCENARIO_BY_ID } from '@/data/scenarios';
import { AGENT_JOURNAL, STAGE_MILESTONES } from '@/data/journalScripts';
import type { AgentTask, Stage } from '@/types';

class SimulationEngine {
  private abort: AbortController | null = null;
  private running = false;

  start(fromIndex = 1): void {
    // Cancel any previous run
    this.cancel();
    this.abort = new AbortController();
    this.running = true;
    const signal = this.abort.signal;
    void this.runPipeline(fromIndex, signal).finally(() => {
      this.running = false;
    });
  }

  cancel(): void {
    if (this.abort) {
      this.abort.abort();
      this.abort = null;
    }
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  private async runPipeline(fromIndex: number, signal: AbortSignal): Promise<void> {
    const store = useOrchestrationStore;
    const scenario = SCENARIO_BY_ID[store.getState().run.scenarioId];

    const totalStages = store.getState().stages.length;
    for (let i = fromIndex; i < totalStages; i++) {
      if (signal.aborted) return;

      const stage = store.getState().stages[i];
      store.getState().setCurrentStageIndex(i);

      // Enter stage
      store.getState().setStageState(stage.id, 'queued');
      const milestone = STAGE_MILESTONES[stage.id];
      if (milestone?.enter) {
        store.getState().emitJournal({
          severity: 'info',
          stageId: stage.id,
          message: milestone.enter
        });
      }

      if (!(await this.sleep(400, signal))) return;
      if (!(await this.waitWhilePaused(signal))) return;

      store.getState().setStageState(stage.id, 'running');

      const ok = await this.runStage(stage, scenario.id, signal);
      if (!ok) return;

      // Complete stage
      store.getState().setStageState(stage.id, 'completed');
      store.getState().setStageProgress(stage.id, 1);
      store.getState().revealArtifacts(stage.id);
      store.getState().setCheckpoint(i);
      if (milestone?.complete) {
        store.getState().emitJournal({
          severity: 'success',
          stageId: stage.id,
          message: milestone.complete
        });
      }

      if (!(await this.sleep(300, signal))) return;
      if (!(await this.waitWhilePaused(signal))) return;

      // Halt for human approval between SIT and Pre-Prod
      if (stage.id === 'sit') {
        store.getState().markAwaitingPreprodApproval();
        return;
      }
    }

    // All stages done — final approval gate
    store.getState().markAwaitingApproval();
  }

  private async runStage(
    stageSnapshot: Stage,
    scenarioId: string,
    signal: AbortSignal
  ): Promise<boolean> {
    const store = useOrchestrationStore;
    const scenario = SCENARIO_BY_ID[scenarioId as keyof typeof SCENARIO_BY_ID];
    const agents = stageSnapshot.agents;

    for (let idx = 0; idx < agents.length; idx++) {
      const agent = agents[idx];
      if (signal.aborted) return false;
      if (!(await this.waitWhilePaused(signal))) return false;

      const shouldFail =
        !store.getState().run.failureResolved &&
        scenario.failureStageId === stageSnapshot.id &&
        scenario.failureAgentId === agent.id;

      // Start agent
      store.getState().setAgentState(stageSnapshot.id, agent.id, 'running');
      const script = AGENT_JOURNAL[agent.id];
      if (script?.onStart) {
        store.getState().emitJournal({
          severity: script.onStart.severity ?? 'info',
          stageId: stageSnapshot.id,
          agentId: agent.id,
          message: script.onStart.message
        });
      }

      // Run with progress ticks
      const ok = await this.runAgentTicking(stageSnapshot, agent, idx, signal);
      if (!ok) return false;

      if (shouldFail) {
        // Emit failure
        store.getState().setAgentState(
          stageSnapshot.id,
          agent.id,
          'failed',
          scenario.failureMessage
        );
        store.getState().setStageState(stageSnapshot.id, 'failed');
        store.getState().emitJournal({
          severity: 'error',
          stageId: stageSnapshot.id,
          agentId: agent.id,
          message: `${agent.name} failed: ${scenario.failureMessage ?? 'Unknown failure.'}`
        });
        store.getState().failRun(scenario.failureMessage ?? 'Pipeline halted.');
        return false;
      }

      // Complete agent
      store.getState().setAgentState(stageSnapshot.id, agent.id, 'completed');
      if (script?.onComplete) {
        store.getState().emitJournal({
          severity: script.onComplete.severity ?? 'success',
          stageId: stageSnapshot.id,
          agentId: agent.id,
          message: script.onComplete.message
        });
      }

      // Stage progress
      const pct = (idx + 1) / agents.length;
      store.getState().setStageProgress(stageSnapshot.id, pct);
    }

    return true;
  }

  private async runAgentTicking(
    stage: Stage,
    agent: AgentTask,
    agentIndex: number,
    signal: AbortSignal
  ): Promise<boolean> {
    const store = useOrchestrationStore;
    const ticks = 6;
    const perTick = agent.durationMs / ticks;
    const base = agentIndex / stage.agents.length;
    const span = 1 / stage.agents.length;
    for (let t = 1; t <= ticks; t++) {
      if (signal.aborted) return false;
      if (!(await this.waitWhilePaused(signal))) return false;
      if (!(await this.sleep(perTick, signal))) return false;
      store.getState().setStageProgress(stage.id, base + span * (t / ticks));
    }
    return true;
  }

  private sleep(ms: number, signal: AbortSignal): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (signal.aborted) return resolve(false);
      const timeout = setTimeout(() => resolve(true), ms);
      const onAbort = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  private async waitWhilePaused(signal: AbortSignal): Promise<boolean> {
    const store = useOrchestrationStore;
    while (store.getState().run.state === 'paused') {
      if (signal.aborted) return false;
      if (!(await this.sleep(120, signal))) return false;
    }
    return !signal.aborted;
  }
}

export const simulationEngine = new SimulationEngine();
