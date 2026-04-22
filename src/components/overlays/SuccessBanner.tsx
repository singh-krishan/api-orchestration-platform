import { motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, Package, AlertOctagon, Rocket } from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { simulationEngine } from '@/lib/simulationEngine';

export function SuccessBanner() {
  const setActiveTab = useOrchestrationStore(s => s.setActiveTab);
  const setScenario = useOrchestrationStore(s => s.setScenario);
  const restart = useOrchestrationStore(s => s.restartRun);
  const approveAndDeployProd = useOrchestrationStore(s => s.approveAndDeployProd);

  const replay = () => {
    simulationEngine.cancel();
    restart();
    useOrchestrationStore.getState().startRun();
    simulationEngine.start(1);
  };

  const runFailure = () => {
    simulationEngine.cancel();
    setScenario('security-gate-failure');
    restart();
    useOrchestrationStore.getState().startRun();
    simulationEngine.start(1);
  };

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="relative mx-5 mt-4 overflow-hidden rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 p-4 shadow-glow-emerald"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: '60%' }}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/20 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-300">
              Release pack assembled
            </div>
            <div className="text-[16px] font-semibold text-slate-50">
              Ready for Production Deployment — Pending Human Approval
            </div>
            <div className="mt-0.5 text-[12px] text-slate-300">
              All automated gates passed. No deployment will occur without explicit CAB approval.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:pl-[60px]">
          <button
            onClick={approveAndDeployProd}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/60 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 px-3 py-1.5 text-[12px] font-semibold text-emerald-50 shadow-glow-emerald hover:from-emerald-500/40 hover:to-cyan-500/40"
          >
            <Rocket className="h-3.5 w-3.5" />
            Approve &amp; Deploy to Live
          </button>
          <button
            onClick={() => setActiveTab('release-pack')}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-medium text-emerald-100 hover:bg-emerald-500/20"
          >
            <Package className="h-3.5 w-3.5" />
            View Release Pack
          </button>
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
            <AlertOctagon className="h-3.5 w-3.5" />
            Run a Failure Scenario
          </button>
        </div>
      </div>
    </motion.div>
  );
}
