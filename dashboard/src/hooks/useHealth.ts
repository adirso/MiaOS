import { useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 30_000;

export type HealthStatus = 'healthy' | 'unhealthy' | 'checking';

export function useHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch('/api/health');
        if (!cancelled) setStatus(res.ok ? 'healthy' : 'unhealthy');
      } catch {
        if (!cancelled) setStatus('unhealthy');
      }
    }

    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return status;
}
