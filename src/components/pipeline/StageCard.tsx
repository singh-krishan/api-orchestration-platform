import { motion } from 'framer-motion';
import {
  Boxes,
  Check,
  CircleDashed,
  FileCheck2,
  FlaskConical,
  GitBranch,
  GitMerge,
  Inbox,
  Scale,
  Loader2,
  Pause,
  RotateCcw,
  Rocket,
  ShieldCheck,
  X
} from 'lucide-react';
import type { NodeState, Stage } from '@/types';
import { cn } from '@/lib/cn';
import { AgentRow } from './AgentRow';
import { useOrchestrationStore } from '@/store/orchestrationStore';

const STAGE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  intake: Inbox,
  'spec-ingestion': FileCheck2,
  'build-generation': GitBranch,
  'dev-validation': FlaskConical,
  'ai-governance-eval': Scale,
  'mr-validation': GitMerge,
  sit: Boxes,
  staging: ShieldCheck,
  'production-pack': Rocket
};

const STATE_ACCENT: Record<NodeState, { border: string; glow: string; label: string; chip: string; progress: string }> = {
  pending:    { border: 'border-slate-800',      glow: '', label: 'Pending',    chip: 'bg-slate-800 text-slate-400',        progress: 'bg-slate-700' },
  queued:     { border: 'border-sky-500/40',     glow: '', label: 'Queued',     chip: 'bg-sky-500/15 text-sky-300',         progress: 'bg-sky-400' },
  running:    { border: 'border-cyan-400/60',    glow: 'shadow-glow', label: 'Running', chip: 'bg-cyan-400/15 text-cyan-300', progress: 'bg-cyan-400' },
  completed:  { border: 'border-emerald-400/40', glow: '', label: 'Completed',  chip: 'bg-emerald-400/15 text-emerald-300', progress: 'bg-emerald-400' },
  failed:     { border: 'border-red-500/60',     glow: 'shadow-glow-red', label: 'Failed', chip: 'bg-red-500/15 text-red-300', progress: 'bg-red-500' },
  blocked:    { border: 'border-amber-400/50',   glow: '', label: 'Blocked',    chip: 'bg-amber-400/15 text-amber-300',     progress: 'bg-amber-400' },
  paused:     { border: 'border-amber-400/40',   glow: '', label: 'Paused',     chip: 'bg-amber-400/15 text-amber-300',     progress: 'bg-amber-400' },
  resumable:  { border: 'border-violet-400/50',  glow: '', label: 'Resumable',  chip: 'bg-violet-400/15 text-violet-300',   progress: 'bg-violet-400' }
};

function StageStateIcon({ state }: { state: NodeState }) {
  const cls = 'h-3.5 w-3.5';
  switch (state) {
    case 'running':  return <Loader2 className={cn(cls, 'animate-spin')} />;
    case 'completed':return <Check className={cls} />;
    case 'failed':   return <X className={cls} />;
    case 'paused':
    case 'blocked':  return <Pause className={cls} />;
    case 'resumable':return <RotateCcw className={cls} />;
    default:         return <CircleDashed className={cls} />;
  }
}

export function StageCard({ stage }: { stage: Stage }) {
  const Icon = STAGE_ICON[stage.id] ?? Boxes;
  const accent = STATE_ACCENT[stage.state];
  const selectStage = useOrchestrationStore(s => s.selectStage);
  const artifactCount = stage.artifactIds.length;

  return (
    <motion.button
      layout
      onClick={() => selectStage(stage.id)}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={cn(
        'relative flex w-[300px] shrink-0 flex-col rounded-xl border bg-slate-900/70 p-4 text-left backdrop-blur-md transition-all',
        accent.border,
        accent.glow,
        'hover:border-slate-600 hover:bg-slate-900'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60',
          stage.state === 'running' && 'border-cyan-400/40 text-cyan-300',
          stage.state === 'completed' && 'border-emerald-400/30 text-emerald-300',
          stage.state === 'failed' && 'border-red-500/40 text-red-300',
          (stage.state === 'paused' || stage.state === 'blocked') && 'border-amber-400/40 text-amber-300',
          stage.state === 'resumable' && 'border-violet-400/40 text-violet-300'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-medium tracking-wider text-slate-500">
              STAGE {stage.index.toString().padStart(2, '0')}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
              accent.chip
            )}>
              <StageStateIcon state={stage.state} />
              {accent.label}
            </span>
          </div>
          <div className="mt-0.5 text-sm font-semibold text-slate-100 leading-tight">
            {stage.shortName}
          </div>
        </div>
      </div>

      <div className="mt-2 text-[11.5px] leading-snug text-slate-400 line-clamp-2">
        {stage.description}
      </div>

      {/* Progress */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className={cn('h-full rounded-full', accent.progress)}
          initial={false}
          animate={{ width: `${Math.round(stage.progress * 100)}%` }}
          transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Agents */}
      <div className="mt-3 flex flex-col gap-1.5">
        {stage.agents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/20 px-3 py-3 text-[11px] text-slate-500">
            Operator intake. No automated agents in this stage.
          </div>
        ) : (
          stage.agents.map(agent => <AgentRow key={agent.id} agent={agent} />)
        )}
      </div>

      {/* Footer */}
      {artifactCount > 0 && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>{artifactCount} artifact{artifactCount !== 1 ? 's' : ''}</span>
          <span className="text-slate-600">Click to inspect →</span>
        </div>
      )}
    </motion.button>
  );
}
