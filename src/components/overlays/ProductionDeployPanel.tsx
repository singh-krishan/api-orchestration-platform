import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Rocket,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { simulationEngine } from '@/lib/simulationEngine';
import { cn } from '@/lib/cn';

type StepState = 'pending' | 'running' | 'completed';

interface DeployStep {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  completionNote: string;
}

const STEPS: DeployStep[] = [
  {
    id: 'promote-tag',
    name: 'Release Promotion Agent',
    description: 'Promoting signed release tag v1.0.0 from pre-prod to production registry.',
    durationMs: 1800,
    completionNote: 'Image platform/payments:v1.0.0 promoted · SBOM re-attested · signature verified.'
  },
  {
    id: 'prod-deploy',
    name: 'Production Deploy Agent',
    description: 'Rolling blue/green deployment to payments-prod with 10% canary shift.',
    durationMs: 2600,
    completionNote: '3/3 replicas READY in 41s · canary shifted to 100% · zero-downtime cutover.'
  },
  {
    id: 'prod-smoke',
    name: 'Production Smoke Agent',
    description: 'Running post-deploy probes against live production service.',
    durationMs: 1800,
    completionNote: '5/5 probes green · p95 178 ms · 0.0% error rate over 90s.'
  },
  {
    id: 'monitoring',
    name: 'Post-Deploy Monitoring Agent',
    description: 'Registering SLO alerts and confirming dashboards are reporting healthy.',
    durationMs: 1600,
    completionNote: 'SLO alerts armed · Grafana dashboard live · on-call notified.'
  }
];

export function ProductionDeployPanel() {
  const runState = useOrchestrationStore(s => s.run.state);
  const completeProdDeploy = useOrchestrationStore(s => s.completeProdDeploy);
  const emitJournal = useOrchestrationStore(s => s.emitJournal);
  const restart = useOrchestrationStore(s => s.restartRun);
  const setScenario = useOrchestrationStore(s => s.setScenario);

  const [stepStates, setStepStates] = useState<StepState[]>(() => STEPS.map(() => 'pending'));

  useEffect(() => {
    if (runState !== 'deploying-prod') return;
    let cancelled = false;
    const timers: number[] = [];

    const run = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        setStepStates(prev => prev.map((s, idx) => (idx === i ? 'running' : s)));
        emitJournal({
          severity: 'info',
          message: `${STEPS[i].name}: ${STEPS[i].description}`
        });
        await new Promise<void>(resolve => {
          const t = window.setTimeout(resolve, STEPS[i].durationMs);
          timers.push(t);
        });
        if (cancelled) return;
        setStepStates(prev => prev.map((s, idx) => (idx === i ? 'completed' : s)));
        emitJournal({
          severity: 'success',
          message: `${STEPS[i].name} completed — ${STEPS[i].completionNote}`
        });
      }
      if (!cancelled) completeProdDeploy();
    };

    run();
    return () => {
      cancelled = true;
      timers.forEach(t => window.clearTimeout(t));
    };
  }, [runState, emitJournal, completeProdDeploy]);

  const replay = () => {
    simulationEngine.cancel();
    setStepStates(STEPS.map(() => 'pending'));
    restart();
    useOrchestrationStore.getState().startRun();
    simulationEngine.start(1);
  };

  const runFailure = () => {
    simulationEngine.cancel();
    setStepStates(STEPS.map(() => 'pending'));
    setScenario('security-gate-failure');
    restart();
    useOrchestrationStore.getState().startRun();
    simulationEngine.start(1);
  };

  const isDeployed = runState === 'deployed';

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={cn(
        'relative mx-5 mt-4 overflow-hidden rounded-xl border p-4 shadow-glow-emerald',
        isDeployed
          ? 'border-emerald-400/50 bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-emerald-500/10'
          : 'border-violet-400/40 bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-violet-500/10'
      )}
    >
      {!isDeployed && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/10 to-transparent"
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '60%' }}
        />
      )}
      <div className="relative">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg border',
              isDeployed
                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                : 'border-violet-400/40 bg-violet-500/20 text-violet-200'
            )}
          >
            {isDeployed ? <CheckCircle2 className="h-5 w-5" /> : <Rocket className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                'text-[10.5px] font-semibold uppercase tracking-wider',
                isDeployed ? 'text-emerald-300' : 'text-violet-300'
              )}
            >
              {isDeployed ? 'Production deployment successful' : 'Deploying to production'}
            </div>
            <div className="text-[16px] font-semibold text-slate-50">
              {isDeployed
                ? 'Payments Reconciliation API — Live in Production'
                : 'Approval granted · rolling out to payments-prod'}
            </div>
            <div className="mt-0.5 text-[12px] text-slate-300">
              {isDeployed
                ? 'Service is live with SLO monitoring armed. Rollback plan remains on file.'
                : 'Executing post-approval deploy pipeline with blue/green cutover.'}
            </div>
          </div>
          {isDeployed && (
            <div className="flex items-center gap-2">
              <a
                href="#"
                onClick={e => e.preventDefault()}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-medium text-emerald-100 hover:bg-emerald-500/20"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Live Service
              </a>
              <button
                onClick={replay}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[12px] font-medium text-slate-200 hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Replay Demo
              </button>
              <button
                onClick={runFailure}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[12px] font-medium text-slate-200 hover:bg-slate-800"
              >
                Run a Failure Scenario
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {STEPS.map((step, i) => {
            const state = stepStates[i];
            return (
              <div
                key={step.id}
                className={cn(
                  'relative flex items-start gap-2.5 rounded-lg border px-3 py-2.5',
                  state === 'running' && 'border-cyan-400/40 bg-cyan-400/5',
                  state === 'completed' && 'border-emerald-400/30 bg-emerald-400/5',
                  state === 'pending' && 'border-slate-800 bg-slate-900/40'
                )}
              >
                {state === 'running' && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-cyan-400/30"
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.03 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                <div className="pt-0.5">
                  {state === 'running' && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-400" />
                  )}
                  {state === 'completed' && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                  {state === 'pending' && (
                    <CircleDashed className="h-4 w-4 shrink-0 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-slate-100">{step.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-slate-400">
                    {state === 'completed' ? step.completionNote : step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
