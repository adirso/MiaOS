/**
 * Mia agent - LLM integration using Vercel AI SDK
 * Supports OpenAI and Google Gemini via env OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY
 * Uses installed skills and optional Google Calendar MCP as tools.
 */
import { generateText, type CoreMessage, type ToolSet } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { buildSkillTools } from './skills/registry.js';
import { getGoogleCalendarMCPTools } from './mcp/google-calendar.js';

const BASE_SYSTEM_PROMPT = `You are Mia, a friendly and helpful AI assistant. You help users with questions, coding, and tasks. Be concise but thorough.`;

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
 * Merge skill tools with optional Google Calendar MCP tools.
 */
async function getAllTools(): Promise<ToolSet> {
  const skillTools = buildSkillTools(getModel);
  const mcpTools = await getGoogleCalendarMCPTools();
  return { ...skillTools, ...(mcpTools ?? {}) } as ToolSet;
}

/**
 * Send messages to the LLM and return the assistant reply.
 * Uses enabled skills and, if configured, Google Calendar MCP as tools.
 */
export async function chat(messages: CoreMessage[]): Promise<string> {
  const model = getModel();
  const tools = await getAllTools();
  const toolKeys = Object.keys(tools);
  const systemPrompt =
    toolKeys.length > 0
      ? `${BASE_SYSTEM_PROMPT}\n\nYou have access to tools that you can call when the user asks for actions: ${toolKeys.join(', ')}. Use the appropriate tool when the user's request matches (e.g. calendar events, scheduling); then summarize the result for the user.`
      : BASE_SYSTEM_PROMPT;

  const { text } = await generateText({
    model,
    system: systemPrompt,
    messages,
    tools: toolKeys.length > 0 ? tools : undefined,
    maxSteps: toolKeys.length > 0 ? 5 : 1,
  });

  return text;
}
