/**
 * Persist which skills are enabled (repo + npm). Only enabled skills are loaded as tools.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DEFAULT_CONFIG_DIR = join(homedir(), '.miaos');
const ENABLED_FILENAME = 'enabled.json';

export const REPO_PREFIX = 'repo:';
export const NPM_PREFIX = 'npm:';

function getEnabledPath(): string {
  const dir = process.env.MIAOS_SKILLS_DIR
    ? join(process.env.MIAOS_SKILLS_DIR, '..')
    : DEFAULT_CONFIG_DIR;
  return join(dir, ENABLED_FILENAME);
}

/**
 * Load the list of enabled skill keys (repo:id or npm:package).
 */
export function loadEnabledList(): string[] {
  try {
    const path = getEnabledPath();
    if (!existsSync(path)) return [];
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((e): e is string => typeof e === 'string');
  } catch {
    return [];
  }
}

/**
 * Save the enabled list to disk.
 */
export function saveEnabledList(keys: string[]): void {
  const path = getEnabledPath();
  const dir = join(path, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(keys, null, 2), 'utf-8');
}

export function isEnabled(key: string): boolean {
  return loadEnabledList().includes(key);
}

export function setEnabled(key: string, enabled: boolean): void {
  let list = loadEnabledList();
  if (enabled) {
    if (!list.includes(key)) list = [...list, key];
  } else {
    list = list.filter((k) => k !== key);
  }
  saveEnabledList(list);
}
