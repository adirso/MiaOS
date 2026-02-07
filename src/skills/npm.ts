/**
 * Install and uninstall skill packages into the skills directory.
 * Only verified packages (in catalog) can be installed.
 */
import { execSync } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { isVerifiedPackage } from './catalog.js';

const DEFAULT_SKILLS_DIR = join(homedir(), '.miaos', 'skills');

function getSkillsDir(): string {
  return process.env.MIAOS_SKILLS_DIR ?? DEFAULT_SKILLS_DIR;
}

/**
 * Ensure the skills directory exists and has a package.json so npm install works.
 */
function ensureSkillsDirSync(): string {
  const dir = getSkillsDir();
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(dir)) {
    execSync(`mkdir -p "${dir}"`, { stdio: 'inherit' });
  }
  if (!existsSync(pkgPath)) {
    const pkg = { name: 'miaos-skills', private: true, description: 'MiaOS installed skills' };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
  return dir;
}

/**
 * Install a package into the skills directory. Fails if the package is not in the verified catalog.
 */
export function installPackage(packageName: string): void {
  if (!isVerifiedPackage(packageName)) {
    throw new Error(`Package "${packageName}" is not in the verified catalog. Only verified skills can be installed.`);
  }
  const dir = ensureSkillsDirSync();
  execSync(`npm install ${packageName} --prefix "${dir}" --no-save`, {
    stdio: 'inherit',
    cwd: dir,
  });
}

/**
 * Uninstall a package from the skills directory.
 */
export function uninstallPackage(packageName: string): void {
  const dir = getSkillsDir();
  const nodeModules = join(dir, 'node_modules');
  const target = join(nodeModules, packageName);
  if (!existsSync(target)) {
    return; // already not installed
  }
  rmSync(target, { recursive: true });
  // Optionally run npm prune to clean dependencies; for simplicity we just remove the folder
}
