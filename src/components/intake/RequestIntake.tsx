import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  Play,
  Sparkles,
  AlertOctagon,
  ShieldAlert,
  Boxes,
  Pause,
  Loader2,
  Workflow
} from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { SCENARIOS } from '@/data/scenarios';
import { simulationEngine } from '@/lib/simulationEngine';
import type { ScenarioId } from '@/types';
import { cn } from '@/lib/cn';
import { FlowDiagramModal } from './FlowDiagramModal';

const SCENARIO_ICON: Record<ScenarioId, typeof Sparkles> = {
  'happy-path': Sparkles,
  'oas-validation-failure': AlertOctagon,
  'security-gate-failure': ShieldAlert,
  'sit-integration-failure': Boxes,
  'manual-pause-demo': Pause
};

export function RequestIntake() {
  const uploadedFileName = useOrchestrationStore(s => s.uploadedFileName);
  const setUploadedFile = useOrchestrationStore(s => s.setUploadedFile);
  const scenarioId = useOrchestrationStore(s => s.scenarioId);
  const setScenario = useOrchestrationStore(s => s.setScenario);
  const startRun = useOrchestrationStore(s => s.startRun);
  const [drag, setDrag] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploadedFileName) {
      setParsing(false);
      setParsed(false);
      return;
    }
    setParsed(false);
    setParsing(true);
    const t = window.setTimeout(() => {
      setParsing(false);
      setParsed(true);
    }, 1200);
    return () => window.clearTimeout(t);
  }, [uploadedFileName]);

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadedFile(files[0].name);
  };

  const useSample = () =>
    setUploadedFile('Payments_Reconciliation_Interface_v2.4.docx');

  const start = () => {
    if (!uploadedFileName) return;
    startRun();
    simulationEngine.start(1);
  };

  return (
    <div className="relative flex h-full items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 grid-dots opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl"
      >
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-slate-400">
            <Sparkles className="h-3 w-3 text-cyan-300" />
            AI API Delivery Platform
          </div>
          <h1 className="text-[22px] font-semibold leading-tight text-slate-50 sm:text-[28px]">
            Orchestrate an API from specification to production-ready release pack.
          </h1>
          <p className="mt-2 text-[13.5px] text-slate-400">
            Upload a backend interface spec, pick a scenario, and watch AI agents collaborate across
            the SDLC — stopping at the final human approval gate.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setFlowOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-[12px] font-medium text-cyan-100 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/15"
            >
              <Workflow className="h-3.5 w-3.5" />
              View end-to-end flow
            </button>
          </div>
        </div>
        <FlowDiagramModal open={flowOpen} onClose={() => setFlowOpen(false)} />

        <div className="grid gap-5 md:grid-cols-5">
          {/* Upload */}
          <div className="md:col-span-3">
            <Section title="1. Upload interface specification">
              <label
                onDragOver={e => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDrag(false);
                  onFiles(e.dataTransfer.files);
                }}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                  drag ? 'border-cyan-400/60 bg-cyan-400/5' : 'border-slate-700 hover:border-slate-600'
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.yaml,.yml,.json"
                  className="hidden"
                  onChange={e => onFiles(e.target.files)}
                />
                {uploadedFileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="font-mono text-[13px] text-slate-100">{uploadedFileName}</div>
                    <div className="text-[11px] text-slate-400">Click to replace or drop a new file</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-cyan-300">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div className="text-[13px] text-slate-200">
                      Drop interface spec here, or click to browse
                    </div>
                    <div className="text-[11px]">PDF · DOCX · YAML · JSON · TXT · MD</div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    inputRef.current?.click();
                  }}
                  className="sr-only"
                >
                  Browse
                </button>
              </label>
              <button
                onClick={useSample}
                className="mt-2 text-[11.5px] text-cyan-300 hover:text-cyan-200"
              >
                Use sample spec: Payments_Reconciliation_Interface_v2.4.docx
              </button>
            </Section>

            <div className="mt-5" />

            <Section title="3. Inferred API summary (preview)">
              <AnimatePresence mode="wait">
                {!uploadedFileName ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center rounded-md border border-dashed border-slate-800 bg-slate-950/30 px-4 py-6 text-center text-[12px] text-slate-500"
                  >
                    Summary appears once an interface specification is uploaded.
                  </motion.div>
                ) : parsing ? (
                  <motion.div
                    key="parsing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/5 px-4 py-6 text-[12px] text-cyan-200"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Parsing specification…
                  </motion.div>
                ) : (
                  <motion.div
                    key="parsed"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-2 gap-3 text-[11.5px]"
                  >
                    <SummaryRow k="Domain" v="Payments & Reconciliation" delay={0.00} />
                    <SummaryRow k="Endpoints" v="5" delay={0.05} />
                    <SummaryRow k="Authentication" v="OAuth 2.0 + mTLS" delay={0.10} />
                    <SummaryRow k="Archetype" v="Spring Boot 3.3" delay={0.15} />
                    <SummaryRow k="SLO" v="p95 ≤ 250 ms · 99.95%" delay={0.20} />
                    <SummaryRow k="Partners" v="BACS · FPS · Settlement" delay={0.25} />
                  </motion.div>
                )}
              </AnimatePresence>
              {parsed && <span className="sr-only" aria-live="polite">Specification parsed.</span>}
            </Section>
          </div>

          {/* Scenario + CTA */}
          <div className="md:col-span-2">
            <Section title="2. Select scenario">
              <div className="flex flex-col gap-1.5">
                {SCENARIOS.map(sc => {
                  const Icon = SCENARIO_ICON[sc.id];
                  const active = sc.id === scenarioId;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setScenario(sc.id)}
                      className={cn(
                        'flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors',
                        active
                          ? 'border-cyan-400/50 bg-cyan-400/5'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded',
                          active
                            ? 'bg-cyan-400/15 text-cyan-200'
                            : 'bg-slate-800 text-slate-400'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'text-[12.5px] font-semibold',
                              active ? 'text-cyan-100' : 'text-slate-100'
                            )}
                          >
                            {sc.name}
                          </span>
                          {sc.failureStageId && (
                            <span className="rounded-full bg-red-500/10 px-1 py-[1px] text-[9.5px] font-medium uppercase tracking-wide text-red-300">
                              fail
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">
                          {sc.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

            <div className="mt-5" />

            <button
              disabled={!uploadedFileName}
              onClick={start}
              className={cn(
                'group flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-[13.5px] font-semibold transition-all',
                uploadedFileName
                  ? 'border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-50 hover:from-cyan-500/30 hover:to-violet-500/30 shadow-glow'
                  : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-500'
              )}
            >
              <Play className="h-4 w-4" />
              Start Orchestration
            </button>
            {!uploadedFileName && (
              <p className="mt-1.5 text-center text-[11px] text-slate-500">
                Upload a specification to enable.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 gradient-border">
        {children}
      </div>
    </div>
  );
}

function SummaryRow({ k, v, delay = 0 }: { k: string; v: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-0.5 rounded-md border border-slate-800/70 bg-slate-950/40 px-2.5 py-2"
    >
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{k}</span>
      <span className="text-[12px] text-slate-200">{v}</span>
    </motion.div>
  );
}
