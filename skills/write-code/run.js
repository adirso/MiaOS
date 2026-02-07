#!/usr/bin/env node
/**
 * Write Code skill: run JavaScript only in an isolated temp directory with a timeout.
 * Input: { code: string, timeoutSeconds?: number }
 * Output: { success: boolean, stdout?: string, stderr?: string, error?: string }
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const DEFAULT_TIMEOUT = 15;
const MAX_TIMEOUT = 60;
const MAX_CODE_LENGTH = 20_000;

/** Patterns that are not allowed (dangerous or system access). */
const FORBIDDEN_PATTERNS = [
  /\brequire\s*\(\s*['"]child_process['"]\s*\)/,
  /\brequire\s*\(\s*['"]cluster['"]\s*\)/,
  /\brequire\s*\(\s*['"]fs['"]\s*\)/,
  /\brequire\s*\(\s*['"]worker_threads['"]\s*\)/,
  /\brequire\s*\(\s*['"]vm['"]\s*\)/,
  /\bprocess\.exit\s*\(/,
  /\bprocess\.kill\s*\(/,
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
];

function checkRestrictions(code) {
  if (code.length > MAX_CODE_LENGTH) {
    return { ok: false, error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters.` };
  }
  const normalized = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const re of FORBIDDEN_PATTERNS) {
    if (re.test(normalized)) {
      return { ok: false, error: 'Code uses a restricted API (e.g. require("fs"), process.exit, eval). Only safe JavaScript is allowed.' };
    }
  }
  return { ok: true };
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

function runInTempDir(code, timeoutSeconds = DEFAULT_TIMEOUT) {
  const timeoutMs = Math.min(Math.max(Number(timeoutSeconds) || DEFAULT_TIMEOUT, 1), MAX_TIMEOUT) * 1000;
  const scriptName = 'script.js';
  const command = 'node';
  const args = [scriptName];

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'miaos-write-code-'));
  const scriptPath = path.join(tmpDir, scriptName);

  try {
    fs.writeFileSync(scriptPath, code, 'utf8');
  } catch (e) {
    return { success: false, error: `Failed to write script: ${e.message}` };
  }

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: tmpDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        PATH: process.env.PATH || '/usr/bin:/bin',
        NODE_ENV: 'development',
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (chunk) => { stderr += chunk; });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({
        success: false,
        stdout,
        stderr,
        error: `Script timed out after ${timeoutMs / 1000}s`,
      });
    }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ success: false, stdout, stderr, error: err.message });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (signal === 'SIGKILL') {
        resolve({ success: false, stdout, stderr, error: 'Script timed out' });
        return;
      }
      resolve({
        success: code === 0,
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        error: code !== 0 ? `Exit code ${code}` : undefined,
      });
    });
  }).finally(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  });
}

readStdin()
  .then((raw) => {
    const input = JSON.parse(raw);
    const code = input.code;
    const timeoutSeconds = input.timeoutSeconds;

    if (typeof code !== 'string' || !code.trim()) {
      process.stdout.write(JSON.stringify({ success: false, error: 'Missing or empty code' }) + '\n');
      process.exit(1);
    }

    const restriction = checkRestrictions(code);
    if (!restriction.ok) {
      process.stdout.write(JSON.stringify({ success: false, error: restriction.error }) + '\n');
      process.exit(1);
    }

    return runInTempDir(code, timeoutSeconds);
  })
  .then((result) => {
    process.stdout.write(JSON.stringify(result) + '\n');
    process.exit(result.success ? 0 : 1);
  })
  .catch((e) => {
    process.stdout.write(JSON.stringify({ success: false, error: e.message || String(e) }) + '\n');
    process.exit(1);
  });
