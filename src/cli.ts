#!/usr/bin/env node
/**
 * Mia CLI - Interactive assistant in the terminal
 * Greets, then sends your messages to the LLM (OpenAI or Gemini) and prints the response.
 */
import { createInterface } from 'readline';
import { chat } from './agent.js';
import 'dotenv/config';
import type { CoreMessage } from 'ai';

const GREETING = 'Hey, My name is Mia, how I can help you?';

const messages: CoreMessage[] = [];

function log(msg: string): void {
  console.log(msg);
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function run(): Promise<void> {
  log(GREETING);
  log('');

  while (true) {
    const userInput = await prompt('You: ');
    if (!userInput) continue;
    if (['exit', 'quit', 'bye'].includes(userInput.toLowerCase())) {
      log('Bye! See you soon.');
      process.exit(0);
    }

    messages.push({ role: 'user', content: userInput });

    try {
      log('\nMia: ');
      const reply = await chat(messages);
      log(reply);
      messages.push({ role: 'assistant', content: reply });
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : String(err)}`);
      messages.pop(); // remove last user message so they can retry
    }
    log('');
  }
}

run();
