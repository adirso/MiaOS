/**
 * Mia API server – exposes /api/chat and /api/skills for the dashboard and other clients.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chat } from './agent.js';
import {
  getGoogleCalendarMCPTools,
  getGoogleCalendarMCPStatus,
} from './mcp/google-calendar.js';
import {
  loadCatalog,
  listInstalled,
  listAvailable,
  installPackage,
  uninstallPackage,
  isVerifiedPackage,
  setEnabled,
} from './skills/index.js';
import type { CoreMessage } from 'ai';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/calendar-status', async (_req, res) => {
  try {
    await getGoogleCalendarMCPTools();
    const status = getGoogleCalendarMCPStatus();
    res.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ configured: true, toolsLoaded: false, error: message });
  }
});

app.get('/api/skills/store', (req, res) => {
  try {
    let catalog = loadCatalog();
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    if (q) {
      catalog = catalog.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.package.toLowerCase().includes(q)
      );
    }
    res.json({ skills: catalog });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.get('/api/skills/available', (_req, res) => {
  try {
    const available = listAvailable();
    res.json({
      skills: available.map((s) => ({
        key: s.key,
        id: s.id,
        name: s.name,
        description: s.description,
        source: s.source,
        enabled: s.enabled,
        package: s.package,
        version: s.version,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.get('/api/skills/installed', (_req, res) => {
  try {
    const installed = listInstalled();
    res.json({
      skills: installed.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        package: s.package,
        version: s.version,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/skills/enable', (req, res) => {
  try {
    const { key } = req.body as { key?: string };
    if (!key || typeof key !== 'string') {
      res.status(400).json({ error: 'key is required (e.g. repo:example or npm:package-name)' });
      return;
    }
    setEnabled(key, true);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/skills/disable', (req, res) => {
  try {
    const { key } = req.body as { key?: string };
    if (!key || typeof key !== 'string') {
      res.status(400).json({ error: 'key is required' });
      return;
    }
    setEnabled(key, false);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/skills/install', (req, res) => {
  try {
    const { package: pkg } = req.body as { package?: string };
    if (!pkg || typeof pkg !== 'string') {
      res.status(400).json({ error: 'package is required' });
      return;
    }
    if (!isVerifiedPackage(pkg)) {
      res.status(403).json({ error: 'Only verified skills can be installed. This package is not in the catalog.' });
      return;
    }
    installPackage(pkg);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/skills/uninstall', (req, res) => {
  try {
    const { package: pkg } = req.body as { package?: string };
    if (!pkg || typeof pkg !== 'string') {
      res.status(400).json({ error: 'package is required' });
      return;
    }
    uninstallPackage(pkg);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body as { messages: CoreMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required and must not be empty' });
      return;
    }
    const text = await chat(messages);
    res.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Mia API running at http://localhost:${PORT}`);
});
