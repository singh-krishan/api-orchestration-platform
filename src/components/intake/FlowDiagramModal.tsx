import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Sparkles,
  FileCode,
  ShieldCheck,
  Boxes,
  TestTube2,
  Scale,
  GitMerge,
  Network,
  UserCheck,
  Rocket,
  Package,
  CheckCircle2,
  Wrench,
  ArrowDown,
  ArrowRight,
  Cog
} from 'lucide-react';
import { cn } from '@/lib/cn';

type NodeKind = 'input' | 'ai' | 'deterministic' | 'hybrid' | 'human' | 'fix' | 'done';

const KIND_STYLES: Record<NodeKind, string> = {
  input: 'border-slate-600 bg-slate-800/80 text-slate-100',
  ai: 'border-violet-400/40 bg-violet-500/10 text-violet-100',
  deterministic: 'border-sky-400/40 bg-sky-500/10 text-sky-100',
  hybrid: 'border-amber-400/40 bg-amber-500/10 text-amber-100',
  human: 'border-orange-400/50 bg-orange-500/10 text-orange-100',
  fix: 'border-red-400/40 bg-red-500/10 text-red-100',
  done: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
};

const LEGEND: { kind: NodeKind; label: string }[] = [
  { kind: 'input', label: 'Input' },
  { kind: 'ai', label: 'AI (LLM agent)' },
  { kind: 'deterministic', label: 'Deterministic service' },
  { kind: 'hybrid', label: 'Hybrid (Code + LLM)' },
  { kind: 'human', label: 'Human Approval' },
  { kind: 'fix', label: 'Failure / Fix Loop' },
  { kind: 'done', label: 'Complete' }
];

function Node({
  icon: Icon,
  title,
  subtitle,
  kind
}: {
  icon: typeof FileText;
  title: string;
  subtitle?: string;
  kind: NodeKind;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border px-3 py-2 shadow-sm',
        KIND_STYLES[kind]
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="text-[12px] font-semibold leading-tight">{title}</div>
        {subtitle && (
          <div className="text-[10.5px] font-normal leading-tight opacity-75">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function DownArrow() {
  return (
    <div className="flex justify-center py-1 text-slate-600">
      <ArrowDown className="h-3.5 w-3.5" />
    </div>
  );
}

export function FlowDiagramModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="relative my-4 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/95 px-5 py-3 backdrop-blur">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                  How it works
                </div>
                <div className="text-[15px] font-semibold text-slate-50">
                  End-to-end delivery flow
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-md border border-slate-800 bg-slate-900/60 p-1.5 text-slate-300 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              {/* Legend */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {LEGEND.map(l => (
                  <div
                    key={l.kind}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium',
                      KIND_STYLES[l.kind]
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {l.label}
                  </div>
                ))}
              </div>

              <p className="mb-5 text-[12.5px] leading-relaxed text-slate-300">
                A backend interface specification enters on the left. A small set of LLM agents
                handle the open-ended work (reading the spec, drafting the OpenAPI contract),
                while deterministic services own the rest of the critical path (validation,
                code generation, CI, promotion, release packaging). Two human approval gates
                — Pre-Prod and Production — ensure no deployment happens without sign-off. If
                an automated gate fails, the pipeline halts, an operator applies a fix, and
                the run resumes from the checkpoint.
              </p>

              {/* Flow */}
              <div className="flex flex-col gap-2">
                <Node
                  icon={FileText}
                  title="Interface Spec Uploaded"
                  subtitle="Backend team provides PDF / DOCX / YAML"
                  kind="input"
                />
                <DownArrow />
                <Node
                  icon={Sparkles}
                  title="Spec Ingestion"
                  subtitle="LLM reads the spec and extracts a structured SpecModel"
                  kind="ai"
                />
                <DownArrow />
                <Node
                  icon={FileCode}
                  title="OAS Authoring"
                  subtitle="LLM drafts the OpenAPI 3.1 contract from the SpecModel"
                  kind="ai"
                />
                <DownArrow />
                <Node
                  icon={ShieldCheck}
                  title="OAS Validation & QA"
                  subtitle="Spectral + OPA policy rules validate the contract — deterministic"
                  kind="deterministic"
                />
                <DownArrow />
                <Node
                  icon={Boxes}
                  title="Build Generation"
                  subtitle="OpenAPI Generator scaffolds the Spring Boot service + opens an MR"
                  kind="deterministic"
                />
                <DownArrow />
                <Node
                  icon={ShieldCheck}
                  title="Dev Validation"
                  subtitle="Build, tests, SonarQube quality gate, security scan"
                  kind="deterministic"
                />
                <DownArrow />
                <Node
                  icon={Scale}
                  title="AI Governance & Evals"
                  subtitle="Deterministic policy checks + LLM-assisted scoring of AI-authored artefacts"
                  kind="hybrid"
                />
                <DownArrow />
                <Node
                  icon={GitMerge}
                  title="Merge Request Validation"
                  subtitle="Pipeline runs against main; code merges only after green"
                  kind="deterministic"
                />
                <DownArrow />
                <Node
                  icon={Network}
                  title="System Integration Testing (SIT)"
                  subtitle="Deploys to SIT and runs contract + integration tests"
                  kind="deterministic"
                />
                <DownArrow />
                <Node
                  icon={UserCheck}
                  title="Human Approval — Pre-Prod"
                  subtitle="Reviewer approves SIT evidence before promotion"
                  kind="human"
                />
                <DownArrow />
                <Node
                  icon={Rocket}
                  title="Pre-Prod / Staging Rollout"
                  subtitle="ArgoCD deploy + readiness probes — fully automated"
                  kind="deterministic"
                />
                <DownArrow />
                <Node
                  icon={Package}
                  title="Production Release Pack"
                  subtitle="Manifest + rollback plan assembled (code) with an LLM-drafted summary"
                  kind="hybrid"
                />
                <DownArrow />
                <Node
                  icon={UserCheck}
                  title="Human Approval — Production"
                  subtitle="CAB sign-off before live deployment"
                  kind="human"
                />
                <DownArrow />
                <Node
                  icon={CheckCircle2}
                  title="Deployed to Production"
                  kind="done"
                />
              </div>

              {/* Failure loop callout */}
              <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-red-300">
                  <Wrench className="h-3.5 w-3.5" />
                  If an automated gate fails
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <Node
                      icon={ShieldCheck}
                      title="Gate fails (e.g. Security / SIT / OAS)"
                      kind="fix"
                    />
                  </div>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-red-300/80 sm:block" />
                  <ArrowDown className="h-4 w-4 self-center text-red-300/80 sm:hidden" />
                  <div className="flex-1">
                    <Node
                      icon={Wrench}
                      title="Apply Mock Fix"
                      subtitle="Operator reviews findings and applies the remediation"
                      kind="fix"
                    />
                  </div>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-red-300/80 sm:block" />
                  <ArrowDown className="h-4 w-4 self-center text-red-300/80 sm:hidden" />
                  <div className="flex-1">
                    <Node
                      icon={Cog}
                      title="Resume from Checkpoint"
                      subtitle="Pipeline re-enters at the failed stage and continues"
                      kind="deterministic"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-3 py-2 text-[12px] text-cyan-100">
                <TestTube2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  Every stage emits artefacts (contract, code, test results, security reports,
                  release pack) — all visible in the <span className="font-semibold">Artifacts</span>{' '}
                  panel during the run.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
