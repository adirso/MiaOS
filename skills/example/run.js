#!/usr/bin/env node
/**
 * Example skill: reads JSON from stdin, writes JSON to stdout.
 * Input: { name: string }
 * Output: { message: string }
 */
const chunks = [];
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(chunks.join(''));
    const name = input.name ?? 'there';
    process.stdout.write(JSON.stringify({ message: `Hello, ${name}!` }) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: String(e.message) }) + '\n');
    process.exit(1);
  }
});
