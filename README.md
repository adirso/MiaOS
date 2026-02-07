# MiaOS

**Mia** – An intelligence assistant in the CLI (and later Web with React) with skills from a store. Think ClaudeCode / ClawdBot style: you chat with Mia, and she can run skills and help you get things done.

## Start: CLI agent

The CLI greets you, then sends your messages to an LLM (OpenAI or Gemini) via the [Vercel AI SDK](https://sdk.vercel.ai) and prints the response. Conversation history is kept so you can have a multi-turn chat.

### Setup

1. **Clone and install**

   ```bash
   cd MiaOS
   npm install
   ```

2. **API key (pick one)**

   Create a `.env` file in the project root with one of:

   - **OpenAI:** `OPENAI_API_KEY=sk-...`
   - **Gemini:** `GOOGLE_GENERATIVE_AI_API_KEY=...`

### Run

```bash
npm start
# or
npm run cli
```

You’ll see:

```
Hey, My name is Mia, how I can help you?

You: <type your message>
```

Your message is sent to the LLM; the reply is printed, and you can keep chatting. Type `exit`, `quit`, or `bye` to leave.

### Tech

- **Language:** TypeScript
- **Runtime:** Node.js 18+
- **Run:** `tsx` (no build step for `npm start`); use `npm run build` to compile to `dist/`
- **AI:** Vercel AI SDK (`ai`), `@ai-sdk/openai`, `@ai-sdk/google`
- **CLI:** Node `readline`, no extra CLI framework

Provider is chosen automatically: if `OPENAI_API_KEY` is set, OpenAI is used; otherwise Gemini (if `GOOGLE_GENERATIVE_AI_API_KEY` is set).

---

*Planned: Web UI (React), skills store, and running skills from the assistant.*
