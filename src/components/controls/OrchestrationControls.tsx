import { Pause, Play, RotateCcw, Wrench, SkipForward } from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { simulationEngine } from '@/lib/simulationEngine';
import { cn } from '@/lib/cn';

export function OrchestrationControls() {
  const runState = useOrchestrationStore(s => s.run.state);
  const pauseRun = useOrchestrationStore(s => s.pauseRun);
  const resumeRun = useOrchestrationStore(s => s.resumeRun);
  const restartRun = useOrchestrationStore(s => s.restartRun);
  const applyMockFix = useOrchestrationStore(s => s.applyMockFix);
  const prepareResume = useOrchestrationStore(s => s.prepareResumeFromCheckpoint);

  const isRunning = runState === 'running';
  const isPaused = runState === 'paused';
  const isFailed = runState === 'failed';
  const isResumable = runState === 'resumable';
  const isDone =
    runState === 'awaiting-approval' ||
    runState === 'awaiting-preprod-approval' ||
    runState === 'deploying-prod' ||
    runState === 'deployed' ||
    runState === 'completed';

  const onRestart = () => {
    simulationEngine.cancel();
    restartRun();
  };

  return (
    <div className="flex items-center gap-1.5">
      {isRunning && (
        <IconButton icon={Pause} label="Pause" onClick={pauseRun} tone="amber" />
      )}
      {isPaused && (
        <IconButton icon={Play} label="Resume" onClick={resumeRun} tone="cyan" />
      )}
      {isFailed && (
        <IconButton icon={Wrench} label="Apply Mock Fix" onClick={applyMockFix} tone="violet" />
      )}
      {isResumable && (
        <IconButton
          icon={SkipForward}
          label="Resume from Checkpoint"
          onClick={() => {
            const from = prepareResume();
            simulationEngine.start(from);
          }}
          tone="cyan"
        />
      )}
      {(isRunning || isPaused || isFailed || isResumable || isDone) && (
        <IconButton icon={RotateCcw} label="Restart" onClick={onRestart} tone="slate" />
      )}
    </div>
  );
}

type Tone = 'cyan' | 'amber' | 'violet' | 'slate' | 'emerald';

const TONE_CLS: Record<Tone, string> = {
  cyan: 'bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 border-cyan-400/30',
  amber: 'bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 border-amber-400/30',
  violet: 'bg-violet-400/10 text-violet-200 hover:bg-violet-400/20 border-violet-400/30',
  emerald: 'bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 border-emerald-400/30',
  slate: 'bg-slate-800/70 text-slate-200 hover:bg-slate-700 border-slate-700'
};

function IconButton({
  icon: Icon,
  label,
  onClick,
  tone
}: {
  icon: typeof Pause;
  label: string;
  onClick: () => void;
  tone: Tone;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors',
        TONE_CLS[tone]
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
