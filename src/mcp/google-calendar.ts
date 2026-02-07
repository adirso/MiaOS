/**
 * Google Calendar MCP – connect to @cocal/google-calendar-mcp via stdio.
 * Uses OAuth 2.0 (Desktop app); set GOOGLE_OAUTH_CREDENTIALS to the path to your OAuth client JSON.
 * On first run the MCP server may open a browser for sign-in.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import type { ToolSet } from 'ai';

let cachedTools: ToolSet | null | undefined = undefined;
let lastError: string | null = null;

/**
 * Resolve credentials path and check file exists. Returns absolute path or null.
 */
function resolveCredentialsPath(): string | null {
  const raw =
    process.env.GOOGLE_OAUTH_CREDENTIALS ?? process.env.GOOGLE_CALENDAR_MCP_CREDENTIALS;
  if (!raw?.trim()) return null;
  const resolved = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  if (!fs.existsSync(resolved)) {
    lastError = `Credentials file not found: ${resolved}`;
    console.warn('[Mia] Google Calendar MCP:', lastError);
    return null;
  }
  return resolved;
}

/**
 * Get tools from the Google Calendar MCP server, or null if not configured.
 * Requires GOOGLE_OAUTH_CREDENTIALS (path to OAuth client JSON from Google Cloud Console).
 */
export async function getGoogleCalendarMCPTools(): Promise<ToolSet | null> {
  const credentialsPath = resolveCredentialsPath();
  if (!credentialsPath) {
    if (!process.env.GOOGLE_OAUTH_CREDENTIALS && !process.env.GOOGLE_CALENDAR_MCP_CREDENTIALS) {
      lastError = null; // Not configured is not an error
    }
    return null;
  }

  if (cachedTools !== undefined) return cachedTools;
  lastError = null;

  const tokenPath =
    process.env.GOOGLE_CALENDAR_MCP_TOKEN_PATH ||
    path.join(os.homedir(), '.miaos', 'google-calendar-mcp-token.json');

  try {
    const transport = new Experimental_StdioMCPTransport({
      command: 'npx',
      args: ['-y', '@cocal/google-calendar-mcp'],
      env: {
        ...process.env,
        GOOGLE_OAUTH_CREDENTIALS: credentialsPath,
        GOOGLE_CALENDAR_MCP_TOKEN_PATH: tokenPath,
      },
    });

    const client = await createMCPClient({
      transport,
      name: 'google-calendar-mcp',
    });

    const tools = await client.tools();
    cachedTools = tools ?? null;
    if (cachedTools && Object.keys(cachedTools).length > 0) {
      console.info('[Mia] Google Calendar MCP: tools loaded:', Object.keys(cachedTools).join(', '));
    }
    return cachedTools;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    lastError = message;
    console.error('[Mia] Google Calendar MCP failed to start:', err);
    cachedTools = null;
    return null;
  }
}

/**
 * Return current calendar MCP status for diagnostics (e.g. /api/calendar-status).
 */
export function getGoogleCalendarMCPStatus(): {
  configured: boolean;
  toolsLoaded: boolean;
  error: string | null;
} {
  const configured = !!(process.env.GOOGLE_OAUTH_CREDENTIALS ?? process.env.GOOGLE_CALENDAR_MCP_CREDENTIALS);
  return {
    configured,
    toolsLoaded: cachedTools !== undefined && cachedTools !== null && Object.keys(cachedTools).length > 0,
    error: lastError,
  };
}
