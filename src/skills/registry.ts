/**
 * Load available skills (in-repo + npm) and build AI SDK tools from enabled ones.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { tool, jsonSchema, type ToolSet } from 'ai';
import { runSkill } from './runner.js';
import { listRepoSkills } from './repo.js';
import { loadEnabledList, NPM_PREFIX } from './enabled.js';
import { reviewCodeForUserRequest } from './codeReview.js';

const DEFAULT_SKILLS_DIR = join(homedir(), '.miaos', 'skills');

function getSkillsDir(): string {
  return process.env.MIAOS_SKILLS_DIR ?? DEFAULT_SKILLS_DIR;
}

export interface InstalledSkillMeta {
  id: string;
  name: string;
  description: string;
  package: string;
  version?: string;
  entryPoint: string;
  parameters: Record<string, unknown>;
}

/** Unified skill meta for both repo and npm; key = repo:id or npm:package */
export interface AvailableSkill {
  key: string;
  id: string;
  name: string;
  description: string;
  source: 'repo' | 'npm';
  entryPoint: string;
  parameters: Record<string, unknown>;
  rootPath: string;
  package?: string;
  version?: string;
}

function readPackageSkillManifest(packageRoot: string): InstalledSkillMeta | null {
  const pkgPath = join(packageRoot, 'package.json');
  if (!existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const skill = pkg.skill;
    if (!skill || typeof skill.id !== 'string' || typeof skill.description !== 'string') return null;
    const entryPoint = skill.entryPoint ?? 'dist/run.js';
    const parameters =
      skill.parameters && typeof skill.parameters === 'object'
        ? skill.parameters
        : { type: 'object', properties: {} };
    return {
      id: skill.id,
      name: skill.name ?? skill.id,
      description: skill.description,
      package: pkg.name,
      version: pkg.version,
      entryPoint,
      parameters,
    };
  } catch {
    return null;
  }
}

/**
 * List all installed npm skills (scan node_modules under skills dir).
 */
export function listInstalled(): InstalledSkillMeta[] {
  const skillsDir = getSkillsDir();
  const nodeModules = join(skillsDir, 'node_modules');
  if (!existsSync(nodeModules)) return [];
  const entries: InstalledSkillMeta[] = [];
  try {
    const topDirs = readdirSync(nodeModules, { withFileTypes: true }).filter(
      (e) => e.isDirectory() && !e.name.startsWith('.')
    );
    for (const d of topDirs) {
      let packageRoot: string;
      if (d.name.startsWith('@')) {
        const scopedDirs = readdirSync(join(nodeModules, d.name), { withFileTypes: true }).filter(
          (e) => e.isDirectory()
        );
        for (const sd of scopedDirs) {
          packageRoot = join(nodeModules, d.name, sd.name);
          const meta = readPackageSkillManifest(packageRoot);
          if (meta) entries.push(meta);
        }
        continue;
      }
      packageRoot = join(nodeModules, d.name);
      const meta = readPackageSkillManifest(packageRoot);
      if (meta) entries.push(meta);
    }
  } catch {
    // no node_modules or not readable
  }
  return entries;
}

/**
 * List all available skills (in-repo + installed npm), with enabled flag.
 */
export function listAvailable(): (AvailableSkill & { enabled: boolean })[] {
  const enabledSet = new Set(loadEnabledList());
  const repo = listRepoSkills().map((r) => ({
    key: r.key,
    id: r.id,
    name: r.name,
    description: r.description,
    source: 'repo' as const,
    entryPoint: r.entryPoint,
    parameters: r.parameters,
    rootPath: r.rootPath,
    enabled: enabledSet.has(r.key),
  }));
  const skillsDir = getSkillsDir();
  const nodeModules = join(skillsDir, 'node_modules');
  const npm = listInstalled().map((n) => ({
    key: NPM_PREFIX + n.package,
    id: n.id,
    name: n.name,
    description: n.description,
    source: 'npm' as const,
    entryPoint: n.entryPoint,
    parameters: n.parameters,
    rootPath: join(nodeModules, n.package),
    package: n.package,
    version: n.version,
    enabled: enabledSet.has(NPM_PREFIX + n.package),
  }));
  return [...repo, ...npm];
}

/** Optional: when building write_code tool, call this before running the skill. */
type GetModel = () => import('ai').LanguageModelV1;

/**
 * Build AI SDK tools from enabled skills only (repo + npm). Each skill becomes one tool.
 * Pass getModel so the write_code skill can run an LLM review before executing code.
 */
export function buildSkillTools(getModel?: GetModel): ToolSet {
  const enabled = loadEnabledList();
  const available = listAvailable();
  const toLoad = available.filter((a) => enabled.includes(a.key));
  const tools: ToolSet = {};

  for (const meta of toLoad) {
    const toolName = meta.id.replace(/-/g, '_');
    const isWriteCode = meta.id === 'write-code';

    tools[toolName] = tool({
      description: meta.description,
      parameters: jsonSchema(meta.parameters as Record<string, unknown>),
      execute: async (args): Promise<unknown> => {
        const argRecord = args as Record<string, unknown>;
        const code = argRecord?.code as string | undefined;
        const userRequest = argRecord?.userRequest as string | undefined;

        if (isWriteCode && typeof code === 'string' && code.trim()) {
          const requestSummary = typeof userRequest === 'string' ? userRequest.trim() : '';
          if (!requestSummary) {
            return { error: 'userRequest is required: provide a short summary of what the user asked, so the code can be reviewed before running.', approved: false };
          }
          if (getModel) {
            try {
              const model = getModel();
              const review = await reviewCodeForUserRequest(model, requestSummary, code);
              if (!review.approved) {
                return { error: `Code was not run: ${review.reason}`, approved: false };
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              return { error: `Review failed: ${msg}`, approved: false };
            }
          }
        }

        const result = await runSkill({
          packageRoot: meta.rootPath,
          entryPoint: meta.entryPoint,
          args: argRecord,
        });
        if (!result.success) {
          return { error: result.error };
        }
        return result.result ?? {};
      },
    });
  }

  return tools;
}
