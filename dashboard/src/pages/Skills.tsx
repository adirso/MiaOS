import { useState, useEffect } from 'react';
import './Skills.css';

interface AvailableSkill {
  key: string;
  id: string;
  name: string;
  description: string;
  source: 'repo' | 'npm';
  enabled: boolean;
  package?: string;
  version?: string;
}

interface StoreSkill {
  package: string;
  id: string;
  name: string;
  description: string;
  version?: string;
}

export function Skills() {
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [storeSkills, setStoreSkills] = useState<StoreSkill[]>([]);
  const [search, setSearch] = useState('');
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [loadingStore, setLoadingStore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [actionPackage, setActionPackage] = useState<string | null>(null);

  const fetchAvailable = async () => {
    setLoadingAvailable(true);
    try {
      const res = await fetch('/api/skills/available');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAvailableSkills(data.skills ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load skills');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const fetchStore = async (query: string) => {
    setLoadingStore(true);
    try {
      const q = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await fetch(`/api/skills/store${q}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStoreSkills(data.skills ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load store');
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  useEffect(() => {
    fetchStore(search);
  }, [search]);

  const installedSet = new Set(
    availableSkills.filter((s) => s.source === 'npm').map((s) => s.package).filter(Boolean)
  );

  const handleEnable = async (key: string) => {
    setActionKey(key);
    setError(null);
    try {
      const res = await fetch('/api/skills/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? res.statusText);
      }
      await fetchAvailable();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enable');
    } finally {
      setActionKey(null);
    }
  };

  const handleDisable = async (key: string) => {
    setActionKey(key);
    setError(null);
    try {
      const res = await fetch('/api/skills/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? res.statusText);
      }
      await fetchAvailable();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable');
    } finally {
      setActionKey(null);
    }
  };

  const handleInstall = async (pkg: string) => {
    setActionPackage(pkg);
    setError(null);
    try {
      const res = await fetch('/api/skills/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      await fetchAvailable();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Install failed');
    } finally {
      setActionPackage(null);
    }
  };

  const handleUninstall = async (pkg: string) => {
    setActionPackage(pkg);
    setError(null);
    try {
      const res = await fetch('/api/skills/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? res.statusText);
      }
      await fetchAvailable();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Uninstall failed');
    } finally {
      setActionPackage(null);
    }
  };

  return (
    <div className="skills-page">
      <header className="skills-header">
        <h1>Skills</h1>
        <p className="skills-intro">
          In-repo skills live in the repo; you can also install verified packages from the store. Enable a skill to let Mia use it in chat.
        </p>
      </header>

      {error && (
        <div className="skills-error" role="alert">
          {error}
        </div>
      )}

      <section className="skills-section">
        <h2>Your skills</h2>
        {loadingAvailable ? (
          <p className="skills-loading">Loading…</p>
        ) : availableSkills.length === 0 ? (
          <p className="skills-empty">No skills yet. Add skills in the repo (skills/ folder) or install from the store below.</p>
        ) : (
          <ul className="skills-grid">
            {availableSkills.map((s) => (
              <li key={s.key} className="skill-card">
                <div className="skill-card-body">
                  <h3 className="skill-card-name">{s.name}</h3>
                  <p className="skill-card-desc">{s.description}</p>
                  <p className="skill-card-meta">
                    {s.source === 'repo' ? 'In repo' : s.package}
                    {s.version ? ` @ ${s.version}` : ''}
                  </p>
                </div>
                <div className="skill-card-actions">
                  {s.enabled ? (
                    <button
                      type="button"
                      className="skill-btn skill-btn--secondary"
                      disabled={actionKey === s.key}
                      onClick={() => handleDisable(s.key)}
                    >
                      {actionKey === s.key ? '…' : 'Disable'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="skill-btn skill-btn--primary"
                      disabled={actionKey === s.key}
                      onClick={() => handleEnable(s.key)}
                    >
                      {actionKey === s.key ? '…' : 'Enable'}
                    </button>
                  )}
                  {s.source === 'npm' && s.package && (
                    <button
                      type="button"
                      className="skill-btn skill-btn--danger"
                      disabled={actionPackage === s.package}
                      onClick={() => { const pkg = s.package; if (pkg) handleUninstall(pkg); }}
                    >
                      {actionPackage === s.package ? '…' : 'Uninstall'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="skills-section">
        <h2>Store</h2>
        <p className="skills-section-desc">Install verified npm packages. Only packages in the catalog can be installed.</p>
        <div className="skills-store-bar">
          <input
            type="search"
            className="skills-search"
            placeholder="Search skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loadingStore ? (
          <p className="skills-loading">Loading…</p>
        ) : storeSkills.length === 0 ? (
          <p className="skills-empty">No verified skills in the catalog yet.</p>
        ) : (
          <ul className="skills-grid">
            {storeSkills.map((s) => {
              const isInstalled = installedSet.has(s.package);
              return (
                <li key={s.package} className="skill-card">
                  <div className="skill-card-body">
                    <h3 className="skill-card-name">{s.name}</h3>
                    <p className="skill-card-desc">{s.description}</p>
                    <p className="skill-card-meta">{s.package}</p>
                  </div>
                  <div className="skill-card-actions">
                    {isInstalled ? (
                      <span className="skill-badge">Installed</span>
                    ) : (
                      <button
                        type="button"
                        className="skill-btn skill-btn--primary"
                        disabled={actionPackage === s.package}
                        onClick={() => handleInstall(s.package)}
                      >
                        {actionPackage === s.package ? '…' : 'Install'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
