// One Express app. /api = health, info, the Mock/Real toggle, the guide sections, the diagrams and
// reset. State is per workspace id (X-Workspace) so one visitor's settings never touch another's.
// Loopback Host check and same-origin writes on everything. Serves web/dist.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { hostCheck, sameOriginWrites } from './safety.js';
import { createHealth } from './health.js';
import { mountShelfRoute } from './shelfLink.js';
import { verticalFrom } from './cast.js';
import { modeFrom, realAvailableFrom, realProblemFrom } from './config.js';
import { buildStory, TITLE } from './story.js';
import { DIAGRAM_NAMES, buildDiagram } from './diagramData.js';
import { createWorkspaces, workspaceFrom } from './workspaces.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = process.env.WEB_DIST || path.resolve(HERE, '../../web/dist');

export function createApp({
  health = createHealth(), env = process.env, now = Date.now,
  workspaces = createWorkspaces({ now }),
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(hostCheck);
  app.use(sameOriginWrites);
  app.use((_req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });

  let mode = modeFrom(env);

  const api = express.Router();
  api.use(express.json({ limit: '64kb' }));
  api.use('/health', health.router);
  mountShelfRoute(api, { env });

  api.get('/story', (_req, res) => { res.set('Cache-Control', 'no-store'); res.json(buildStory()); });
  api.get('/diagram', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const name = req.query.name;
    if (name !== undefined && !DIAGRAM_NAMES.includes(name)) {
      return res.status(400).json({ error: 'bad_diagram', detail: `unknown diagram "${String(name).slice(0, 60)}"; known: ${DIAGRAM_NAMES.join(', ')}` });
    }
    return res.json(buildDiagram({}, DIAGRAM_NAMES.includes(name) ? name : DIAGRAM_NAMES[0]));
  });
  api.get('/diagrams', (_req, res) => { res.set('Cache-Control', 'no-store'); res.json({ diagrams: DIAGRAM_NAMES }); });
  api.get('/info', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({
      mode, source: mode, simulated: true, realAvailable: realAvailableFrom(env), realHint: realProblemFrom(env),
      title: TITLE,
      version: (() => { try { return JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version || null; } catch { return null; } })(),
    });
  });
  // Rule 19: exactly { source: "mock"|"real" }; 409 when Real is not enabled.
  api.post('/mode', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !['mock', 'real'].includes(body.source)) {
      return res.status(400).json({ error: 'bad_source', detail: 'body must be exactly { source: "mock" | "real" }' });
    }
    if (body.source === 'real' && !realAvailableFrom(env)) return res.status(409).json({ error: 'real_not_configured', detail: realProblemFrom(env) });
    mode = body.source;
    return res.json({ source: mode });
  });

  const withWorkspace = (handler) => (req, res) => {
    const ws = workspaceFrom(req);
    if (!ws) return res.status(400).json({ error: 'bad_workspace' });
    res.set('Cache-Control', 'no-store');
    return handler(ws, req, res);
  };

  api.get('/runs', withWorkspace((ws, _req, res) => res.json(workspaces.runs(ws))));
  // Reset restores this workspace (the mode stays).
  api.post('/reset', withWorkspace((ws, _req, res) => {
    workspaces.resetWorkspace(ws);
    res.json({ reset: 'ok', workspace: ws });
  }));
  api.use((_req, res) => res.status(404).json({ error: 'not_found' }));
  app.use('/api', api);
  // Errors become short JSON. Express's default handler would send an HTML stack trace with absolute file paths.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = Number(err?.status || err?.statusCode);
    if (status === 413) return res.status(413).json({ error: 'payload_too_large' });
    if (status >= 400 && status < 500) return res.status(status).json({ error: 'bad_request' });
    return res.status(500).json({ error: 'internal_error' });
  });

  if (fs.existsSync(path.join(WEB_DIST, 'index.html'))) {
    app.use(express.static(WEB_DIST));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(WEB_DIST, 'index.html')));
  }
  return app;
}

export function startHttpServer({ port, host, app = createApp() } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => resolve({ server, url: `http://${host}:${server.address().port}/` }));
    server.once('error', reject);
  });
}
