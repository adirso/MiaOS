import { useState, useRef, useEffect } from 'react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';
import './ThemeSelector.css';

function IconSystem() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/** Single icon for the trigger – reflects current preference */
function ThemeTriggerIcon({ preference }: { preference: ThemePreference }) {
  if (preference === 'light') return <IconSun />;
  if (preference === 'dark') return <IconMoon />;
  return <IconSystem />;
}

const OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'System', icon: <IconSystem /> },
  { value: 'light', label: 'Light', icon: <IconSun /> },
  { value: 'dark', label: 'Dark', icon: <IconMoon /> },
];

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="theme-dropdown" ref={containerRef}>
      <button
        type="button"
        className="theme-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Theme"
        title="Theme"
      >
        <ThemeTriggerIcon preference={preference} />
      </button>
      {open && (
        <div
          className="theme-dropdown-menu"
          role="listbox"
          aria-label="Theme"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={preference === opt.value}
              className={'theme-dropdown-option' + (preference === opt.value ? ' theme-dropdown-option--active' : '')}
              onClick={() => {
                setPreference(opt.value);
                setOpen(false);
              }}
            >
              <span className="theme-dropdown-option-icon">{opt.icon}</span>
              <span className="theme-dropdown-option-label">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
