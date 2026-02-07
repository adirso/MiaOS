/**
 * Verified skills catalog – only packages in this list can be installed.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

export interface CatalogEntry {
  package: string;
  id: string;
  name: string;
  description: string;
  version?: string;
}

const DEFAULT_CATALOG_PATH = join(process.cwd(), 'config', 'skills-catalog.json');

function getCatalogPath(): string {
  return process.env.MIAOS_CATALOG_PATH ?? DEFAULT_CATALOG_PATH;
}

/**
 * Load the verified catalog from disk.
 */
export function loadCatalog(): CatalogEntry[] {
  try {
    const path = getCatalogPath();
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e): e is CatalogEntry =>
        e &&
        typeof e.package === 'string' &&
        typeof e.id === 'string' &&
        typeof e.name === 'string' &&
        typeof e.description === 'string'
    );
  } catch {
    return [];
  }
}

/**
 * Check if an npm package name is in the verified catalog.
 */
export function isVerifiedPackage(packageName: string): boolean {
  const catalog = loadCatalog();
  return catalog.some((e) => e.package === packageName);
}

/**
 * Get a catalog entry by package name.
 */
export function getCatalogEntry(packageName: string): CatalogEntry | undefined {
  return loadCatalog().find((e) => e.package === packageName);
}
