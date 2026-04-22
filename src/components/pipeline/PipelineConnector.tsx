import { cn } from '@/lib/cn';
import type { NodeState } from '@/types';

export function PipelineConnector({ from, to }: { from: NodeState; to: NodeState }) {
  const active = from === 'completed' || from === 'running';
  const failed = from === 'failed' || to === 'failed';
  const color = failed
    ? 'stroke-red-500/60'
    : from === 'completed'
      ? 'stroke-emerald-400/60'
      : active
        ? 'stroke-cyan-400/60'
        : 'stroke-slate-700';

  return (
    <div className="flex h-full w-10 shrink-0 items-center justify-center md:w-14">
      <svg viewBox="0 0 56 40" className="h-10 w-full">
        <defs>
          <linearGradient id="conn-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M2 20 L54 20"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={active && !failed ? '6 4' : '0'}
          className={cn(color, active && !failed && 'animate-dashflow')}
        />
        <circle
          cx="54"
          cy="20"
          r="3"
          className={cn(color, 'fill-current')}
        />
      </svg>
    </div>
  );
}
