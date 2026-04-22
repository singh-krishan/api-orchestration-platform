import { useMemo, useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  XCircle,
  BookText
} from 'lucide-react';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import type { Severity } from '@/types';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';

type FilterId = 'all' | 'milestones' | 'errors';

const SEVERITY: Record<Severity, { icon: typeof Info; color: string; border: string; bg: string }> = {
  info:      { icon: Info,          color: 'text-slate-300',  border: 'border-slate-700',       bg: 'bg-slate-900/40' },
  success:   { icon: CheckCircle2,  color: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
  warning:   { icon: AlertTriangle, color: 'text-amber-300',  border: 'border-amber-400/30',   bg: 'bg-amber-400/5' },
  error:     { icon: XCircle,       color: 'text-red-300',    border: 'border-red-500/40',     bg: 'bg-red-500/5' },
  milestone: { icon: Sparkles,      color: 'text-cyan-300',   border: 'border-cyan-400/40',    bg: 'bg-cyan-400/5' }
};

export function BuildJournal() {
  const journal = useOrchestrationStore(s => s.journal);
  const stages = useOrchestrationStore(s => s.stages);
  const [filter, setFilter] = useState<FilterId>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const stageName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const st of stages) map[st.id] = st.shortName;
    return map;
  }, [stages]);

  const filtered = useMemo(() => {
    if (filter === 'milestones') return journal.filter(e => e.severity === 'milestone');
    if (filter === 'errors') return journal.filter(e => e.severity === 'error' || e.severity === 'warning');
    return journal;
  }, [journal, filter]);

  // Auto-scroll to bottom on new entry
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [filtered.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-100">
          <BookText className="h-4 w-4 text-cyan-300" />
          Build Journal
          <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {journal.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'milestones', 'errors'] as FilterId[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
                filter === f
                  ? 'bg-slate-700/70 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[12px] text-slate-500">
            No entries yet. Start the orchestration to see the narrative build journal.
          </div>
        )}
        <AnimatePresence initial={false}>
          {filtered.map(entry => {
            const s = SEVERITY[entry.severity];
            const Icon = s.icon;
            const stage = entry.stageId ? stageName[entry.stageId] : undefined;
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'rounded-lg border-l-2 border-y border-r bg-slate-900/40 px-3 py-2 text-[12.5px] leading-snug',
                  s.border,
                  s.bg
                )}
              >
                <div className="mb-0.5 flex items-center gap-2 text-[10.5px] uppercase tracking-wide text-slate-500">
                  <Icon className={cn('h-3 w-3', s.color)} />
                  <span className="font-mono">{formatTime(entry.timestamp)}</span>
                  {stage && <span className="text-slate-600">·</span>}
                  {stage && <span>{stage}</span>}
                  <span className="ml-auto text-[10px] uppercase text-slate-600">
                    {entry.severity}
                  </span>
                </div>
                <div className="text-slate-200">{entry.message}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
