/**
 * Run a skill in a subprocess: stdin = JSON args, stdout = JSON result.
 */
import { spawn } from 'child_process';
import { join } from 'path';

const DEFAULT_TIMEOUT_MS = 30_000;

export interface RunSkillOptions {
  packageRoot: string;
  entryPoint: string;
  args: Record<string, unknown>;
  timeoutMs?: number;
}

export interface RunSkillResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * Run the skill script; pass args as JSON to stdin, read one JSON line from stdout.
 */
export async function runSkill(options: RunSkillOptions): Promise<RunSkillResult> {
  const { packageRoot, entryPoint, args, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const scriptPath = join(packageRoot, entryPoint);

  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: packageRoot,
    });

    let stdoutData = '';
    let stderrData = '';

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        success: false,
        error: `Skill timed out after ${timeoutMs}ms`,
      });
    }, timeoutMs);

    child.stdout?.setEncoding('utf-8');
    child.stdout?.on('data', (chunk) => {
      stdoutData += chunk;
    });

    child.stderr?.setEncoding('utf-8');
    child.stderr?.on('data', (chunk) => {
      stderrData += chunk;
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ success: false, error: err.message });
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      const line = stdoutData.split('\n')[0]?.trim();
      if (!line) {
        resolve({
          success: false,
          error: code !== 0 ? stderrData || `Exit code ${code}` : 'Skill produced no output',
        });
        return;
      }
      try {
        const result = JSON.parse(line);
        resolve({ success: true, result });
      } catch {
        resolve({
          success: false,
          error: code !== 0 ? stderrData || `Exit code ${code}` : 'Skill output was not valid JSON',
        });
      }
    });

    const input = JSON.stringify(args) + '\n';
    child.stdin?.write(input, (err) => {
      if (err) {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
        return;
      }
      child.stdin?.end();
    });
  });
}
