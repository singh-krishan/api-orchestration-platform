import { useEffect, useState } from 'react';
import { useOrchestrationStore, selectElapsedMs } from '@/store/orchestrationStore';

export function useElapsedTime(): number {
  const state = useOrchestrationStore(s => s.run.state);
  const [ms, setMs] = useState(() => selectElapsedMs(useOrchestrationStore.getState()));

  useEffect(() => {
    setMs(selectElapsedMs(useOrchestrationStore.getState()));
    if (state !== 'running') return;
    const id = window.setInterval(() => {
      setMs(selectElapsedMs(useOrchestrationStore.getState()));
    }, 250);
    return () => window.clearInterval(id);
  }, [state]);

  return ms;
}
