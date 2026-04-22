import { motion } from 'framer-motion';
import {
  Check,
  CircleDashed,
  CircleDot,
  Loader2,
  Pause,
  RotateCcw,
  X,
  Sparkles,
  Cog,
  Combine
} from 'lucide-react';
import type { AgentExecutionKind, AgentTask, NodeState } from '@/types';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';

const KIND_STYLES: Record<
  AgentExecutionKind,
  { chip: string; label: string; icon: typeof Sparkles; title: string }
> = {
  llm: {
    chip: 'bg-violet-500/10 text-violet-200 border-violet-400/30',
    label: 'AI',
    icon: Sparkles,
    title: 'LLM-driven — reasons over unstructured input or drafts natural-language output'
  },
  deterministic: {
    chip: 'bg-sky-500/10 text-sky-200 border-sky-400/30',
    label: 'Code',
    icon: Cog,
    title: 'Deterministic service — runs algorithmic code, no LLM in the critical path'
  },
  hybrid: {
    chip: 'bg-amber-500/10 text-amber-200 border-amber-400/30',
    label: 'Hybrid',
    icon: Combine,
    title: 'Hybrid — deterministic pipeline with an LLM-assisted step (narrative, summary, or scoring)'
  }
};

export function AgentKindBadge({
  kind,
  size = 'sm'
}: {
  kind: AgentExecutionKind;
  size?: 'sm' | 'md';
}) {
  const k = KIND_STYLES[kind];
  const Icon = k.icon;
  return (
    <span
      title={k.title}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold uppercase tracking-wide',
        k.chip,
        size === 'sm' ? 'px-1.5 py-[1px] text-[9.5px]' : 'px-2 py-0.5 text-[10.5px]'
      )}
    >
      <Icon className={cn(size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      {k.label}
    </span>
  );
}

const STATE_STYLES: Record<NodeState, { text: string; ring: string; chip: string; label: string }> = {
  pending:    { text: 'text-slate-500', ring: 'ring-slate-700',   chip: 'bg-slate-800/50 text-slate-400', label: 'Pending' },
  queued:     { text: 'text-sky-400',   ring: 'ring-sky-500/40',  chip: 'bg-sky-500/10 text-sky-300',     label: 'Queued' },
  running:    { text: 'text-cyan-400',  ring: 'ring-cyan-400/60', chip: 'bg-cyan-400/10 text-cyan-300',   label: 'Running' },
  completed:  { text: 'text-emerald-400', ring: 'ring-emerald-400/40', chip: 'bg-emerald-400/10 text-emerald-300', label: 'Completed' },
  failed:     { text: 'text-red-400',   ring: 'ring-red-500/50',  chip: 'bg-red-500/10 text-red-300',     label: 'Failed' },
  blocked:    { text: 'text-amber-400', ring: 'ring-amber-400/40', chip: 'bg-amber-400/10 text-amber-300', label: 'Blocked' },
  paused:     { text: 'text-amber-400', ring: 'ring-amber-400/40', chip: 'bg-amber-400/10 text-amber-300', label: 'Paused' },
  resumable:  { text: 'text-violet-400', ring: 'ring-violet-400/40', chip: 'bg-violet-400/10 text-violet-300', label: 'Resumable' }
};

function StateIcon({ state }: { state: NodeState }) {
  const cls = cn('h-4 w-4 shrink-0', STATE_STYLES[state].text);
  switch (state) {
    case 'running':
      return <Loader2 className={cn(cls, 'animate-spin')} />;
    case 'completed':
      return <Check className={cls} />;
    case 'failed':
      return <X className={cls} />;
    case 'paused':
    case 'blocked':
      return <Pause className={cls} />;
    case 'resumable':
      return <RotateCcw className={cls} />;
    case 'queued':
      return <CircleDot className={cls} />;
    default:
      return <CircleDashed className={cls} />;
  }
}

export function AgentRow({ agent }: { agent: AgentTask }) {
  const s = STATE_STYLES[agent.state];
  return (
    <motion.div
      layout
      className={cn(
        'relative flex items-start gap-2.5 rounded-lg border border-slate-800/70 bg-slate-900/40 px-3 py-2.5 transition-colors',
        agent.state === 'running' && 'border-cyan-400/30'
      )}
    >
      {agent.state === 'running' && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-cyan-400/30"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <div className="pt-0.5">
        <StateIcon state={agent.state} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="truncate text-[13px] font-medium text-slate-100">{agent.name}</div>
          <AgentKindBadge kind={agent.kind} />
          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase', s.chip)}>
            {s.label}
          </span>
        </div>
        <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-slate-400">
          {agent.description}
        </div>
        {agent.failureMessage && (
          <div className="mt-1.5 rounded border border-red-500/30 bg-red-500/5 px-2 py-1 text-[11px] text-red-300">
            {agent.failureMessage}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right font-mono text-[10.5px] text-slate-500">
        {formatDuration(agent.durationMs)}
      </div>
    </motion.div>
  );
}
