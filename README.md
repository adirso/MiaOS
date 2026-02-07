# MiaOS

**Mia** is an assistant that runs on your local computer. You chat with her in the terminal (and later in a web UI). She uses an LLM to answer questions and can run **skills**—either from an existing store or ones you create yourself.

**LLM options:** OpenAI, Grok, Google Gemini, or a local model via Ollama. You pick the provider via config or environment; your data stays on your machine when you use local/Ollama.

**Skills:** Extend Mia with ready-made skills from the store or build custom skills for your own workflows. (Skills store and custom skills are coming in later updates.)

## CLI agent (current)

The CLI greets you, then sends your messages to the configured LLM via the [Vercel AI SDK](https://sdk.vercel.ai) and prints the response. Conversation history is kept so you can have a multi-turn chat. Right now OpenAI and Gemini are supported; Grok and Ollama support are planned.

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
- **Runtime:** Node.js 22+
- **Run:** `tsx` (no build step for `npm start`); use `npm run build` to compile to `dist/`
- **AI:** Vercel AI SDK (`ai`), `@ai-sdk/openai`, `@ai-sdk/google`
- **CLI:** Node `readline`, no extra CLI framework

Provider is chosen automatically: if `OPENAI_API_KEY` is set, OpenAI is used; otherwise Gemini (if `GOOGLE_GENERATIVE_AI_API_KEY` is set). Grok and Ollama support are planned.

---

*Planned: Web UI (React), skills store, custom skills, and Grok/Ollama providers.*
