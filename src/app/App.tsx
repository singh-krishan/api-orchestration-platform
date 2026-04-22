import { useEffect } from 'react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { simulationEngine } from '@/lib/simulationEngine';
import { Header } from '@/components/Header';
import { RequestIntake } from '@/components/intake/RequestIntake';
import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';
import { BuildJournal } from '@/components/journal/BuildJournal';
import { ArtifactsPanel } from '@/components/artifacts/ArtifactsPanel';
import { SuccessBanner } from '@/components/overlays/SuccessBanner';
import { FailureBanner } from '@/components/overlays/FailureBanner';
import { ProductionDeployPanel } from '@/components/overlays/ProductionDeployPanel';
import { PreprodApprovalBanner } from '@/components/overlays/PreprodApprovalBanner';
import { StageDetailDrawer } from '@/components/pipeline/StageDetailDrawer';

export default function App() {
  const runState = useOrchestrationStore(s => s.run.state);

  // Clean up engine on unmount
  useEffect(() => () => simulationEngine.cancel(), []);

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      <Header />

      {runState === 'idle' ? (
        <main className="flex-1 min-h-0">
          <RequestIntake />
        </main>
      ) : (
        <main className="flex flex-col lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-h-0 min-w-0 flex-col border-b border-slate-800 lg:border-b-0 lg:border-r">
            {runState === 'awaiting-preprod-approval' && <PreprodApprovalBanner />}
            {runState === 'awaiting-approval' && <SuccessBanner />}
            {(runState === 'deploying-prod' || runState === 'deployed') && <ProductionDeployPanel />}
            {(runState === 'failed' || runState === 'resumable') && <FailureBanner />}
            <div className="flex min-h-[60vh] flex-1 lg:min-h-0">
              <PipelineCanvas />
            </div>
          </div>
          <div className="flex flex-col lg:grid lg:min-h-0 lg:min-w-0 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-h-[40vh] flex-col overflow-hidden border-b border-slate-800 lg:min-h-0">
              <BuildJournal />
            </div>
            <div className="flex min-h-[50vh] flex-col overflow-hidden lg:min-h-0">
              <ArtifactsPanel />
            </div>
          </div>
        </main>
      )}

      <StageDetailDrawer />
    </div>
  );
}
