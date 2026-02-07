# MiaOS

**Mia** is an assistant that runs on your local computer. You chat with her in the terminal (and later in a web UI). She uses an LLM to answer questions and can run **skills**—either from an existing store or ones you create yourself.

**LLM options:** OpenAI, Grok, Google Gemini, or a local model via Ollama. You pick the provider via config or environment; your data stays on your machine when you use local/Ollama.

**Skills:** Add skills in-repo (e.g. `skills/example/`) or install verified npm packages from the store (dashboard **Skills** page). Enable a skill to let Mia use it in chat. See [docs/skill-spec.md](docs/skill-spec.md) for authoring.

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

## Dashboard (React)

A web dashboard lets you use Mia in the browser: **Dashboard**, **Chat**, **Skills**, **Configuration**, and **Integrations**. Chat and Skills are implemented; Configuration and Integrations are placeholders.

### Run the dashboard

1. **Start the API server** (from the project root):

   ```bash
   npm run server
   ```

   The API runs at `http://localhost:3000`.

2. **Install and run the dashboard** (in another terminal):

   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

   The dashboard runs at `http://localhost:5173`. Vite proxies `/api` to the API server, so the Chat page works without CORS.

3. Open **http://localhost:5173** and use the **Chat** tab to talk to Mia.

### Dashboard tech

- **Stack:** React 18, TypeScript, Vite, React Router
- **Layout:** Sidebar with Chat, Skills, Configuration, Integrations
- **Chat:** Sends messages to `POST /api/chat` and displays the conversation
- **Skills:** “Your skills” lists in-repo skills (`skills/` folder) plus installed npm packages. Enable/disable each; only **enabled** skills are used by Mia in chat. “Store” lists verified npm packages from [config/skills-catalog.json](config/skills-catalog.json); install adds them to your skills, then enable to use.

### Skills (in-repo + npm, enable/disable)

- **In-repo:** Add a folder under `skills/` (e.g. `skills/example/`) with a manifest (`package.json` + `skill` field or `miaos.skill.json`) and an entry script. They appear in “Your skills”; enable to use in chat.
- **npm:** Only packages in `config/skills-catalog.json` can be installed from the store. Installed packages live under `~/.miaos/skills` (or `MIAOS_SKILLS_DIR`). Enable them in “Your skills” to use in chat.
- Enabled list is stored under `~/.miaos/enabled.json`.

### Google Calendar via MCP (OAuth)

To use **Google Calendar** with OAuth (browser sign-in) instead of the in-repo skill:

1. **Google Cloud Console:** Create a project, enable **Google Calendar API**, create **OAuth 2.0 credentials** (Desktop app). Download the JSON and save it (e.g. `~/.miaos/google-oauth.json`). Add your Google account as a test user.
2. **In `.env`** (project root), set the path to that JSON:
   ```env
   GOOGLE_OAUTH_CREDENTIALS=/path/to/your/oauth-client.json
   ```
   (You can use `GOOGLE_CALENDAR_MCP_CREDENTIALS` instead if you prefer.)
3. **First-time sign-in (recommended):** The MCP needs you to sign in with Google once; it stores tokens in `~/.miaos/google-calendar-mcp-token.json`. To trigger the browser sign-in, run the MCP once in a terminal (use the same credentials path as in `.env`):
   ```bash
   GOOGLE_OAUTH_CREDENTIALS=/path/to/your/oauth-client.json npx -y @cocal/google-calendar-mcp
   ```
   When the browser opens, sign in with your Google account. After that, stop the command (Ctrl+C) and start the Mia server; the MCP will reuse the saved token.
4. **Start the server** (`npm run server`) and use Chat. No need to enable the in-repo “Google Calendar” skill when using MCP; Mia will use the MCP calendar tools automatically when `GOOGLE_OAUTH_CREDENTIALS` is set.

**Where to see logs:** All Mia API logs (including Google Calendar MCP messages) are printed in the **terminal where you run `npm run server`**. Look for `[Mia] Google Calendar MCP: tools loaded: ...` (success) or `Credentials file not found` / `failed to start` (failure). You can also call **GET** `http://localhost:3000/api/calendar-status` to see `{ configured, toolsLoaded, error }` without watching the terminal.

---

*Planned: Configuration UI, integrations UI, and Grok/Ollama providers.*
