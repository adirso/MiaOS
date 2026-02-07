import { useHealth, type HealthStatus } from '../hooks/useHealth';
import { ThemeSelector } from './ThemeSelector';
import { Tooltip } from './Tooltip';
import './Header.css';

function HealthIcon({ status }: { status: HealthStatus }) {
  if (status === 'checking') {
    return (
      <svg className="health-icon health-icon--checking" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  if (status === 'healthy') {
    return (
      <svg className="health-icon health-icon--healthy" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <circle cx="5" cy="5" r="4" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="health-icon health-icon--unhealthy" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <circle cx="5" cy="5" r="4" fill="currentColor" />
    </svg>
  );
}

function healthTooltip(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'System healthy – API is reachable';
    case 'unhealthy':
      return 'API unavailable – backend may be down or unreachable';
    default:
      return 'Checking system health…';
  }
}

export function Header() {
  const health = useHealth();

  return (
    <header className="header">
      <nav className="header-nav" aria-label="Main">
        <div className="header-nav-start" />
        <div className="header-nav-end">
          <div className="header-health" role="status" aria-live="polite">
            <Tooltip content={healthTooltip(health)} position="bottom">
              <span className="header-health-inner">
                <HealthIcon status={health} />
                <span className="header-health-label">Health</span>
              </span>
            </Tooltip>
          </div>
          <ThemeSelector />
        </div>
      </nav>
    </header>
  );
}
