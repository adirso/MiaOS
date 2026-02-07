# MiaOS Skill authoring spec

Skills extend Mia with actions (e.g. calendar, notes). You can add skills in two ways:

- **In-repo:** Put skill code in the repo under `skills/<skill-id>/` (e.g. `skills/example/`). No install step; they appear in the dashboard and you **enable** them to use in chat.
- **npm:** Publish a package and add it to the verified catalog; users **install** from the store, then **enable** the skill. Only packages in the catalog can be installed.

Enabled skills are the ones loaded as tools for the agent. Disabled or uninstalled skills are not used.

## Package convention

- **npm:** Publish a package (e.g. `miaos-skill-google-calendar`). Use `"keywords": ["miaos-skill"]` so it can be discovered.
- **Manifest:** Describe the skill in `package.json` under a `skill` field, or in a root `miaos.skill.json`.

## Skill manifest shape

```json
{
  "skill": {
    "id": "calendar-google",
    "name": "Google Calendar",
    "description": "Manage your Google Calendar: create events, list upcoming events, find free slots.",
    "parameters": {
      "type": "object",
      "properties": {
        "action": { "type": "string", "enum": ["list", "create", "freeSlots"], "description": "What to do" },
        "when": { "type": "string", "description": "ISO date or relative (e.g. tomorrow)" }
      },
      "required": ["action"]
    },
    "entryPoint": "dist/run.js"
  }
}
```

- **id:** Unique id (e.g. `calendar-google`). Used as the tool name for the LLM.
- **name:** Display name.
- **description:** Shown in the store and passed to the LLM so it knows when to call this skill.
- **parameters:** JSON Schema for the tool arguments the LLM will generate.
- **entryPoint:** Path from package root to the Node script that runs (e.g. `dist/run.js` or `src/run.js`).

## Execution contract

Mia runs the skill in a **subprocess**:

```bash
node <packageRoot>/<entryPoint>
```

- **Stdin:** A single JSON object (the tool-call arguments). No newline requirement; the runner writes one JSON line.
- **Stdout:** A single JSON object (the result). The runner reads one line and parses it. Use a single line (e.g. `JSON.stringify(result)`).
- **Stderr:** Optional logs; ignored by the runner.
- **Exit code:** Non-zero is treated as failure; stdout is still parsed if present.

Example runner script (Node):

```js
// read stdin, parse JSON, do work, write JSON to stdout
const input = await readStdin(); // one line
const args = JSON.parse(input);
const result = await doWork(args);
console.log(JSON.stringify(result));
```

## In-repo skills

Create a folder under `skills/` (e.g. `skills/calendar-google/`) with:

- **Manifest:** `package.json` with a `skill` field (same shape as above), or a root `miaos.skill.json` with the skill object (no `skill` wrapper).
- **Entry point:** A Node script at the path given by `entryPoint` (e.g. `run.js` or `dist/run.js`). Same execution contract: stdin = JSON args, stdout = one JSON line result.

The server scans `skills/` at startup (or use `MIAOS_REPO_SKILLS_DIR`). In-repo skills appear in the dashboard under “Your skills”; enable them to use in chat.

## Verified catalog (npm)

Only npm packages listed in the MiaOS verified catalog can be installed from the store. The catalog is `config/skills-catalog.json` with entries:

- **package:** npm package name (e.g. `miaos-skill-google-calendar`).
- **id,** **name,** **description:** Override or mirror the package’s `skill` manifest for the store/UI.

To add a verified npm skill, add an entry to the catalog. In-repo skills do not need to be in the catalog.
