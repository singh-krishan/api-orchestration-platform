import { motion } from 'framer-motion';
import { CheckCircle2, Rocket, RotateCcw, Package } from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { simulationEngine } from '@/lib/simulationEngine';

export function PreprodApprovalBanner() {
  const setActiveTab = useOrchestrationStore(s => s.setActiveTab);
  const approveAndDeployPreprod = useOrchestrationStore(s => s.approveAndDeployPreprod);
  const restart = useOrchestrationStore(s => s.restartRun);
  const stages = useOrchestrationStore(s => s.stages);

  const approve = () => {
    approveAndDeployPreprod();
    const stagingIndex = stages.findIndex(s => s.id === 'staging');
    simulationEngine.start(stagingIndex);
  };

  const replay = () => {
    simulationEngine.cancel();
    restart();
    useOrchestrationStore.getState().startRun();
    simulationEngine.start(1);
  };

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="relative mx-5 mt-4 overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-4 shadow-glow"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: '60%' }}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/20 text-amber-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-amber-300">
              SIT complete — human approval required
            </div>
            <div className="text-[16px] font-semibold text-slate-50">
              Ready to deploy to Pre-Prod — Pending Human Approval
            </div>
            <div className="mt-0.5 text-[12px] text-slate-300">
              SIT integration tests green across all partner channels. Review SIT evidence before
              promoting to Pre-Prod.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:pl-[60px]">
          <button
            onClick={approve}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/60 bg-gradient-to-r from-amber-500/30 to-orange-500/30 px-3 py-1.5 text-[12px] font-semibold text-amber-50 shadow-glow hover:from-amber-500/40 hover:to-orange-500/40"
          >
            <Rocket className="h-3.5 w-3.5" />
            Approve &amp; Deploy to Pre-Prod
          </button>
          <button
            onClick={() => setActiveTab('artifacts')}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-[12px] font-medium text-amber-100 hover:bg-amber-500/20"
          >
            <Package className="h-3.5 w-3.5" />
            Review SIT Evidence
          </button>
          <button
            onClick={replay}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[12px] font-medium text-slate-200 hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Replay Demo
          </button>
        </div>
      </div>
    </motion.div>
  );
}
