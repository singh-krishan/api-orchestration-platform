import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOrchestrationStore } from '@/store/orchestrationStore';
import { StageCard } from './StageCard';
import { PipelineConnector } from './PipelineConnector';

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
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-dots opacity-40" />

      <div
        ref={scrollerRef}
        className="relative h-full overflow-x-auto overflow-y-auto px-6 py-5"
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
