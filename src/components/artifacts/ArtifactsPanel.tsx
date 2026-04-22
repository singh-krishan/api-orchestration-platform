import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileBox,
  FileText,
  FileCode,
  ScrollText,
  Package,
  SlidersHorizontal,
  FileJson,
  Lock
} from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import type { Artifact, ArtifactType, TabId } from '@/types';
import { cn } from '@/lib/cn';
import { ArtifactPreview } from './ArtifactPreview';
import { SCENARIOS } from '@/data/scenarios';

const TYPE_ICON: Record<ArtifactType, typeof FileBox> = {
  yaml: FileCode,
  json: FileJson,
  markdown: FileText,
  java: FileCode,
  log: ScrollText,
  text: FileText
};

const TABS: { id: TabId; label: string; icon: typeof FileBox }[] = [
  { id: 'journal', label: 'Journal', icon: ScrollText },
  { id: 'artifacts', label: 'Artifacts', icon: FileBox },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'release-pack', label: 'Release Pack', icon: Package },
  { id: 'scenario', label: 'Scenario', icon: SlidersHorizontal }
];

export function ArtifactsPanel() {
  const activeTab = useOrchestrationStore(s => s.activeTab);
  const setActiveTab = useOrchestrationStore(s => s.setActiveTab);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-800 px-2 py-1.5">
        {TABS.filter(t => t.id !== 'journal').map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                active
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'artifacts' && <ArtifactsTab />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'release-pack' && <ReleasePackTab />}
        {activeTab === 'scenario' && <ScenarioTab />}
        {activeTab === 'journal' && null}
      </div>
    </div>
  );
}

function ArtifactsTab() {
  const stages = useOrchestrationStore(s => s.stages);
  const artifacts = useOrchestrationStore(s => s.artifacts);
  const visibleIds = useOrchestrationStore(s => s.visibleArtifactIds);
  const selectedId = useOrchestrationStore(s => s.selectedArtifactId);
  const selectArtifact = useOrchestrationStore(s => s.selectArtifact);

  const grouped = useMemo(() => {
    return stages
      .filter(s => s.artifactIds.length > 0)
      .map(s => ({
        stage: s,
        items: s.artifactIds
          .map(id => artifacts[id])
          .filter(Boolean) as Artifact[]
      }));
  }, [stages, artifacts]);

  const selected = selectedId ? artifacts[selectedId] : null;

  return (
    <div className="grid h-full grid-rows-[auto_1fr] sm:grid-cols-[minmax(180px,220px)_1fr] sm:grid-rows-none">
      <div className="min-h-0 max-h-[32vh] overflow-y-auto border-b border-slate-800 px-2 py-2 sm:max-h-none sm:border-b-0 sm:border-r">
        {grouped.map(({ stage, items }) => (
          <div key={stage.id} className="mb-3">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {stage.shortName}
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map(a => {
                const unlocked = visibleIds.includes(a.id);
                const Icon = TYPE_ICON[a.type];
                const active = selectedId === a.id;
                return (
                  <button
                    key={a.id}
                    disabled={!unlocked}
                    onClick={() => selectArtifact(a.id)}
                    className={cn(
                      'group flex items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] transition-colors',
                      active
                        ? 'bg-cyan-500/10 text-cyan-200'
                        : unlocked
                          ? 'text-slate-300 hover:bg-slate-800/60'
                          : 'cursor-not-allowed text-slate-600'
                    )}
                  >
                    {unlocked ? (
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate font-mono">{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="min-h-0 overflow-hidden">
        {selected ? (
          <ArtifactPreview artifact={selected} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-[12px] text-slate-500">
            <FileBox className="h-6 w-6 text-slate-700" />
            Select an artifact to preview its contents.
            <span className="text-slate-600">Artifacts unlock as stages complete.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LogsTab() {
  const journal = useOrchestrationStore(s => s.journal);
  return (
    <div className="h-full overflow-y-auto bg-slate-950/60 p-4 font-mono text-[11.5px] leading-relaxed">
      {journal.length === 0 ? (
        <div className="text-slate-500">No log entries yet.</div>
      ) : (
        journal.map(e => (
          <div key={e.id} className="flex gap-3">
            <span className="shrink-0 text-slate-600">
              [{new Date(e.timestamp).toISOString().substring(11, 19)}]
            </span>
            <span
              className={cn(
                'shrink-0 uppercase',
                e.severity === 'error' && 'text-red-400',
                e.severity === 'warning' && 'text-amber-300',
                e.severity === 'success' && 'text-emerald-300',
                e.severity === 'milestone' && 'text-cyan-300',
                e.severity === 'info' && 'text-slate-400'
              )}
            >
              {e.severity.padEnd(9)}
            </span>
            <span className="text-slate-300">{e.message}</span>
          </div>
        ))
      )}
    </div>
  );
}

function ReleasePackTab() {
  const stages = useOrchestrationStore(s => s.stages);
  const artifacts = useOrchestrationStore(s => s.artifacts);
  const visibleIds = useOrchestrationStore(s => s.visibleArtifactIds);
  const selectArtifact = useOrchestrationStore(s => s.selectArtifact);

  const releaseStage = stages.find(s => s.id === 'production-pack');
  const items = (releaseStage?.artifactIds ?? [])
    .map(id => artifacts[id])
    .filter(Boolean) as Artifact[];
  const unlocked = items.every(a => visibleIds.includes(a.id));

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex items-center gap-3">
        <Package className="h-5 w-5 text-cyan-300" />
        <div>
          <div className="text-[14px] font-semibold text-slate-100">Production Release Pack</div>
          <div className="text-[12px] text-slate-400">
            {unlocked
              ? 'All artefacts assembled. Release is staged for human approval.'
              : 'Release pack unlocks once Stage 8 completes.'}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map(a => {
          const locked = !visibleIds.includes(a.id);
          const Icon = TYPE_ICON[a.type];
          return (
            <motion.button
              key={a.id}
              layout
              disabled={locked}
              onClick={() => {
                selectArtifact(a.id);
                useOrchestrationStore.getState().setActiveTab('artifacts');
              }}
              whileHover={locked ? undefined : { y: -1 }}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                locked
                  ? 'border-slate-800 bg-slate-900/30 text-slate-600'
                  : 'border-slate-700/70 bg-slate-900/60 text-slate-200 hover:border-cyan-400/40'
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-800 bg-slate-950/60">
                {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4 text-cyan-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[12px]">{a.name}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">{a.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ScenarioTab() {
  const scenarioId = useOrchestrationStore(s => s.scenarioId);
  const setScenario = useOrchestrationStore(s => s.setScenario);
  const runState = useOrchestrationStore(s => s.run.state);
  const restart = useOrchestrationStore(s => s.restartRun);

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4">
        <div className="text-[14px] font-semibold text-slate-100">Scenario Controls</div>
        <div className="text-[12px] text-slate-400">
          Choose a scenario to demonstrate. Switching a scenario resets the pipeline.
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {SCENARIOS.map(sc => {
          const active = sc.id === scenarioId;
          return (
            <button
              key={sc.id}
              onClick={() => {
                setScenario(sc.id);
                if (runState !== 'idle') restart();
              }}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                active
                  ? 'border-cyan-400/50 bg-cyan-400/5'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('text-[13px] font-semibold', active ? 'text-cyan-200' : 'text-slate-100')}>
                  {sc.name}
                </span>
                {sc.failureStageId && (
                  <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-300">
                    Failure injection
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-slate-400">{sc.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
