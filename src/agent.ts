/**
 * Mia agent - LLM integration using Vercel AI SDK
 * Supports OpenAI and Google Gemini via env OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY
 */
import { generateText, type CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

const SYSTEM_PROMPT = `You are Mia, a friendly and helpful AI assistant. You help users with questions, coding, and tasks. Be concise but thorough.`;

function getModel() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (openaiKey) {
    return openai('gpt-4o-mini');
  }
  if (googleKey) {
    return google('gemini-1.5-flash');
  }
  throw new Error(
    'No LLM API key found. Set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env'
  );
}

/**
 * Send messages to the LLM and return the assistant reply.
 */
export async function chat(messages: CoreMessage[]): Promise<string> {
  const model = getModel();
  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    messages,
  });
  return text;
}
