# Write Code skill

Run user-provided JavaScript in an isolated environment, with restrictions and a safety review.

- **Restrictions:** Max code length 20,000 characters. Forbidden: `require('child_process')`, `require('fs')`, `require('cluster')`, `require('worker_threads')`, `require('vm')`, `process.exit`, `process.kill`, `eval`, `new Function`. Only safe JavaScript is allowed.
- **Review before run:** Mia must provide `userRequest` (what the user asked). An LLM reviews that the code matches the request before it is executed; if not, the code is not run.
- **Isolation:** Each run uses a fresh temp directory and a timeout (default 15s, max 60s).

Enable the skill in the dashboard (Skills → Your skills → Enable "Write Code") so Mia can use it when you ask to run code or try a snippet.
