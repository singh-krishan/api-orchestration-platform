import { AnimatePresence, motion } from 'framer-motion';
import { X, FileBox } from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { AgentRow } from './AgentRow';
import { cn } from '@/lib/cn';

export function StageDetailDrawer() {
  const selectedId = useOrchestrationStore(s => s.selectedStageId);
  const selectStage = useOrchestrationStore(s => s.selectStage);
  const stages = useOrchestrationStore(s => s.stages);
  const artifacts = useOrchestrationStore(s => s.artifacts);
  const visibleIds = useOrchestrationStore(s => s.visibleArtifactIds);
  const selectArtifact = useOrchestrationStore(s => s.selectArtifact);
  const setActiveTab = useOrchestrationStore(s => s.setActiveTab);
  const journal = useOrchestrationStore(s => s.journal);

  const stage = stages.find(s => s.id === selectedId) ?? null;

  const close = () => selectStage(null);

  return (
    <AnimatePresence>
      {stage && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-800 bg-slate-950 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-800 p-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Stage {stage.index.toString().padStart(2, '0')}
                </div>
                <div className="text-[18px] font-semibold text-slate-100">{stage.name}</div>
                <p className="mt-1 text-[12px] text-slate-400">{stage.description}</p>
              </div>
              <button
                onClick={close}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {stage.agents.length > 0 && (
                <div className="mb-5">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Agents
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {stage.agents.map(a => <AgentRow key={a.id} agent={a} />)}
                  </div>
                </div>
              )}

              {stage.artifactIds.length > 0 && (
                <div className="mb-5">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Artifacts
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {stage.artifactIds.map(id => {
                      const a = artifacts[id];
                      if (!a) return null;
                      const unlocked = visibleIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          disabled={!unlocked}
                          onClick={() => {
                            selectArtifact(a.id);
                            setActiveTab('artifacts');
                            close();
                          }}
                          className={cn(
                            'flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                            unlocked
                              ? 'border-slate-800 bg-slate-900/40 hover:border-cyan-400/30'
                              : 'cursor-not-allowed border-slate-900 bg-slate-900/20 text-slate-600'
                          )}
                        >
                          <FileBox className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
                          <div>
                            <div className="font-mono text-[12px] text-slate-100">{a.name}</div>
                            <div className="text-[11px] text-slate-400">{a.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Journal entries for this stage
                </div>
                <div className="flex flex-col gap-1.5">
                  {journal
                    .filter(e => e.stageId === stage.id)
                    .map(e => (
                      <div
                        key={e.id}
                        className="rounded-md border border-slate-800 bg-slate-900/40 p-2 text-[12px] text-slate-300"
                      >
                        {e.message}
                      </div>
                    ))}
                  {journal.filter(e => e.stageId === stage.id).length === 0 && (
                    <div className="rounded-md border border-dashed border-slate-800 bg-slate-900/20 p-3 text-center text-[11px] text-slate-500">
                      No entries yet for this stage.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
