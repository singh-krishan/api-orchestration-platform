import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { StageCard } from './StageCard';
import { PipelineConnector } from './PipelineConnector';
import { AgentKindBadge } from './AgentRow';

export function PipelineCanvas() {
  const stages = useOrchestrationStore(s => s.stages);
  const currentIndex = useOrchestrationStore(s => s.run.currentStageIndex);
  const runState = useOrchestrationStore(s => s.run.state);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (runState === 'idle' || !scrollerRef.current) return;
    const el = scrollerRef.current.querySelector<HTMLElement>(`[data-stage-idx="${currentIndex}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex, runState]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-dots opacity-40" />

      <div className="relative flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-800/70 px-6 py-2 text-[10.5px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-slate-500">
          Execution
        </span>
        <AgentKindBadge kind="llm" />
        <span>LLM agent</span>
        <span className="text-slate-700">·</span>
        <AgentKindBadge kind="deterministic" />
        <span>Deterministic service</span>
        <span className="text-slate-700">·</span>
        <AgentKindBadge kind="hybrid" />
        <span>Hybrid (deterministic + LLM narrative)</span>
      </div>

      <div
        ref={scrollerRef}
        className="relative flex-1 overflow-x-auto overflow-y-auto px-6 py-5"
      >
        <motion.div
          className="flex min-w-min items-stretch"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
          }}
        >
          {stages.map((stage, idx) => (
            <motion.div
              key={stage.id}
              data-stage-idx={stage.index}
              className="flex items-stretch"
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
              }}
            >
              <StageCard stage={stage} />
              {idx < stages.length - 1 && (
                <PipelineConnector
                  from={stage.state}
                  to={stages[idx + 1].state}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
