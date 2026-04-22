import { motion } from 'framer-motion';
import { AlertTriangle, Wrench, SkipForward, RotateCcw, Flag } from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { simulationEngine } from '@/lib/simulationEngine';
import { SCENARIO_BY_ID } from '@/data/scenarios';

export function FailureBanner() {
  const runState = useOrchestrationStore(s => s.run.state);
  const checkpoint = useOrchestrationStore(s => s.run.checkpointStageIndex);
  const stages = useOrchestrationStore(s => s.stages);
  const scenarioId = useOrchestrationStore(s => s.scenarioId);
  const applyMockFix = useOrchestrationStore(s => s.applyMockFix);
  const prepareResume = useOrchestrationStore(s => s.prepareResumeFromCheckpoint);
  const restart = useOrchestrationStore(s => s.restartRun);

  const scenario = SCENARIO_BY_ID[scenarioId];
  const checkpointStage = checkpoint != null ? stages[checkpoint] : null;
  const isResumable = runState === 'resumable';
  const onRestart = () => {
    simulationEngine.cancel();
    restart();
  };

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="relative mx-5 mt-4 overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-red-500/10 p-4 shadow-glow-red"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/20 text-red-200">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-red-300">
            {isResumable ? 'Fix applied — pipeline staged to resume' : 'Pipeline halted'}
          </div>
          <div className="text-[15px] font-semibold text-slate-50">
            {scenario.name}
          </div>
          <div className="mt-0.5 text-[12px] text-slate-300">
            {scenario.failureMessage}
          </div>
          {checkpointStage && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-300">
              <Flag className="h-3 w-3 text-emerald-300" />
              Last successful checkpoint: <span className="font-medium text-slate-100">{checkpointStage.shortName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isResumable && (
            <button
              onClick={applyMockFix}
              className="inline-flex items-center gap-1.5 rounded-md border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-[12px] font-medium text-violet-100 hover:bg-violet-500/25"
            >
              <Wrench className="h-3.5 w-3.5" />
              Apply Mock Fix
            </button>
          )}
          {isResumable && (
            <button
              onClick={() => {
                const from = prepareResume();
                simulationEngine.start(from);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-[12px] font-medium text-cyan-100 hover:bg-cyan-500/25"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Resume from Checkpoint
            </button>
          )}
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[12px] font-medium text-slate-200 hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart Run
          </button>
        </div>
      </div>
    </motion.div>
  );
}
