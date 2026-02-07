/**
 * Discover skills that live in the repo (e.g. skills/ folder).
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export const REPO_SKILLS_KEY_PREFIX = 'repo:';

export interface RepoSkillMeta {
  key: string;
  id: string;
  name: string;
  description: string;
  entryPoint: string;
  parameters: Record<string, unknown>;
  rootPath: string;
  source: 'repo';
}

const DEFAULT_REPO_SKILLS_DIR = join(process.cwd(), 'skills');

function getRepoSkillsDir(): string {
  return process.env.MIAOS_REPO_SKILLS_DIR ?? DEFAULT_REPO_SKILLS_DIR;
}

function readSkillManifest(dirPath: string): RepoSkillMeta | null {
  const pkgPath = join(dirPath, 'package.json');
  const legacyPath = join(dirPath, 'miaos.skill.json');
  let raw: string;
  let fromPkg = true;
  if (existsSync(pkgPath)) {
    raw = readFileSync(pkgPath, 'utf-8');
  } else if (existsSync(legacyPath)) {
    raw = readFileSync(legacyPath, 'utf-8');
    fromPkg = false;
  } else {
    return null;
  }
  try {
    const data = JSON.parse(raw);
    const skill = fromPkg ? data.skill : data;
    if (!skill || typeof skill.id !== 'string' || typeof skill.description !== 'string') return null;
    const entryPoint = skill.entryPoint ?? 'dist/run.js';
    const parameters =
      skill.parameters && typeof skill.parameters === 'object'
        ? skill.parameters
        : { type: 'object', properties: {} };
    const key = REPO_SKILLS_KEY_PREFIX + skill.id;
    return {
      key,
      id: skill.id,
      name: skill.name ?? skill.id,
      description: skill.description,
      entryPoint,
      parameters,
      rootPath: dirPath,
      source: 'repo',
    };
  } catch {
    return null;
  }
}

/**
 * List all in-repo skills (scan skills dir for subdirs with a skill manifest).
 */
export function listRepoSkills(): RepoSkillMeta[] {
  const dir = getRepoSkillsDir();
  if (!existsSync(dir)) return [];
  const entries: RepoSkillMeta[] = [];
  try {
    const subdirs = readdirSync(dir, { withFileTypes: true }).filter(
      (e) => e.isDirectory() && !e.name.startsWith('.')
    );
    for (const d of subdirs) {
      const skillPath = join(dir, d.name);
      const meta = readSkillManifest(skillPath);
      if (meta) entries.push(meta);
    }
  } catch {
    // ignore
  }
  return entries;
}
