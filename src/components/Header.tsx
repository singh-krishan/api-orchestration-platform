import { motion } from 'framer-motion';
import { Activity, Pause, CheckCircle2, XCircle, Clock, Workflow, Rocket } from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { SCENARIO_BY_ID } from '@/data/scenarios';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { formatDuration } from '@/lib/format';
import { OrchestrationControls } from './controls/OrchestrationControls';
import type { RunState } from '@/types';
import { cn } from '@/lib/cn';

const STATE_PILL: Record<RunState, { label: string; cls: string; icon: typeof Activity }> = {
  idle:                { label: 'Idle',                  cls: 'bg-slate-800 text-slate-300 border-slate-700', icon: Clock },
  ready:               { label: 'Ready',                 cls: 'bg-sky-500/10 text-sky-200 border-sky-400/30', icon: Activity },
  running:             { label: 'Running',               cls: 'bg-cyan-500/10 text-cyan-200 border-cyan-400/40', icon: Activity },
  paused:              { label: 'Paused',                cls: 'bg-amber-400/10 text-amber-200 border-amber-400/40', icon: Pause },
  failed:              { label: 'Failed',                cls: 'bg-red-500/10 text-red-200 border-red-500/40', icon: XCircle },
  resumable:           { label: 'Resumable',             cls: 'bg-violet-400/10 text-violet-200 border-violet-400/40', icon: Activity },
  'awaiting-preprod-approval': { label: 'Awaiting Pre-Prod Approval', cls: 'bg-amber-400/10 text-amber-200 border-amber-400/40', icon: CheckCircle2 },
  'awaiting-approval': { label: 'Awaiting Approval',     cls: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40', icon: CheckCircle2 },
  'deploying-prod':    { label: 'Deploying to Prod',     cls: 'bg-violet-500/10 text-violet-200 border-violet-400/40', icon: Rocket },
  deployed:            { label: 'Live in Production',    cls: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40', icon: CheckCircle2 },
  completed:           { label: 'Completed',             cls: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40', icon: CheckCircle2 }
};

export function Header() {
  const runState = useOrchestrationStore(s => s.run.state);
  const scenarioId = useOrchestrationStore(s => s.scenarioId);
  const stages = useOrchestrationStore(s => s.stages);
  const currentIdx = useOrchestrationStore(s => s.run.currentStageIndex);
  const pill = STATE_PILL[runState];
  const Icon = pill.icon;
  const scenario = SCENARIO_BY_ID[scenarioId];
  const currentStage = stages[currentIdx];
  const elapsed = useElapsedTime();

  return (
    <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-gradient-to-br from-cyan-500/20 to-violet-500/10">
            <Workflow className="h-4.5 w-4.5 text-cyan-300" />
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-lg ring-1 ring-cyan-400/30"
              animate={{ opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold leading-tight text-slate-100 sm:text-[14px]">
              <span className="sm:hidden">AI Delivery Console</span>
              <span className="hidden sm:inline">AI API Delivery Orchestration Console</span>
            </div>
            <div className="hidden truncate text-[11px] text-slate-500 sm:block">
              Enterprise Integration · Simulation PoC
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
          <div className="hidden flex-col items-end md:flex">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-slate-500">Scenario</span>
              <span className="font-medium text-slate-200">{scenario.name}</span>
            </div>
            {runState !== 'idle' && currentStage && (
              <div className="text-[11px] text-slate-500">
                Stage {currentStage.index} · {currentStage.shortName}
              </div>
            )}
          </div>

          <div className="hidden items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1 font-mono text-[11px] text-slate-300 md:inline-flex">
            <Clock className="h-3 w-3 text-slate-500" />
            {formatDuration(elapsed)}
          </div>

          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
              pill.cls
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {pill.label}
          </div>

          <OrchestrationControls />
        </div>
      </div>
    </header>
  );
}
