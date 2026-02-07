/**
 * Review generated code against the user's request before running.
 * Uses the same LLM to check that the code does what the user asked.
 */
import { generateText } from 'ai';
import type { LanguageModelV1 } from 'ai';

const REVIEW_PROMPT = `You are a safety reviewer. You will be given:
1. What the user asked (user request).
2. JavaScript code that an AI assistant generated to fulfill that request.

Your job: Decide if the code does what the user asked and is safe to run (e.g. no obvious malicious or unrelated behavior).

Reply with exactly one line in this format:
APPROVED: <one sentence confirming what the code does>
or
REJECTED: <one sentence explaining why the code does not match the request or is unsafe>`;

export interface ReviewResult {
  approved: boolean;
  reason: string;
}

/**
 * Ask the model whether the code matches the user request. Returns approved/rejected and reason.
 */
export async function reviewCodeForUserRequest(
  model: LanguageModelV1,
  userRequest: string,
  code: string
): Promise<ReviewResult> {
  const { text } = await generateText({
    model,
    system: REVIEW_PROMPT,
    messages: [
      {
        role: 'user',
        content: `User request: ${userRequest}\n\nCode:\n\`\`\`javascript\n${code.slice(0, 8000)}\n\`\`\`\n\nReply with APPROVED: or REJECTED: and one sentence.`,
      },
    ],
    maxTokens: 200,
  });

  const reply = (text || '').trim().toUpperCase();
  const approved = reply.startsWith('APPROVED:');
  const reason = reply.startsWith('APPROVED:')
    ? reply.slice(9).trim()
    : reply.startsWith('REJECTED:')
      ? reply.slice(9).trim()
      : reply || 'No clear approval or rejection.';

  return { approved, reason };
}
