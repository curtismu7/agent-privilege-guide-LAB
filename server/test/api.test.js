import test from 'node:test';
import assert from 'node:assert/strict';
import { post, withServer, rawHttp } from './helpers.js';
import { DIAGRAM_NAMES, rawDiagram } from '../src/diagramData.js';

const J = (r) => r.json();

test('GET /api/health is demo-health/1, GET only, and names this lab', async () => {
  await withServer(async (url) => {
    const j = await (await fetch(`${url}/api/health`)).json();
    assert.equal(j.schema, 'demo-health/1');
    assert.equal(j.state, 'ready');
    assert.equal(j.demo.id, 'agent-privilege-guide');
    const bad = await fetch(`${url}/api/health`, { method: 'POST', headers: { origin: url } });
    assert.equal(bad.status, 405);
  });
});

test('GET /api/story: 5 sections, the mental model, and the 6 diagram names the sections point at', async () => {
  await withServer(async (url) => {
    const s = await (await fetch(`${url}/api/story`)).json();
    assert.equal(s.title, 'Agent Privilege — When to Use What');
    assert.equal(s.sections.length, 5);
    assert.deepEqual(s.sections.map((x) => x.n), [1, 2, 3, 4, 5]);
    assert.ok(s.mentalModel.layers.length >= 3);
    assert.ok(s.facts.length >= 5);
    assert.ok(s.talkTrack.length >= 5);
    assert.equal(s.banner.includes('SIMULATION'), true);
    // every section's diagram is one of the served diagram names
    const diagrams = (await (await fetch(`${url}/api/diagrams`)).json()).diagrams;
    assert.deepEqual(diagrams, DIAGRAM_NAMES);
    for (const sec of s.sections) assert.ok(diagrams.includes(sec.diagram), sec.id);
    assert.ok(diagrams.includes(s.mentalModel.diagram));
  });
});

test('GET /api/diagram by name; an unknown name is 400, an absent name falls back to the first diagram', async () => {
  await withServer(async (url) => {
    for (const name of DIAGRAM_NAMES) {
      const d = await (await fetch(`${url}/api/diagram?name=${name}`)).json();
      assert.ok(d.title, name);
      assert.ok(Array.isArray(d.nodes) && d.nodes.length > 0, name);
      assert.ok(Array.isArray(d.steps) && d.steps.length > 0, name);
    }
    const want = await (await fetch(`${url}/api/diagram`)).json();
    const none = await (await fetch(`${url}/api/diagram`)).json();
    assert.deepEqual(none, want, 'no name falls back to the first diagram');
    const unknown = await fetch(`${url}/api/diagram?name=not-a-diagram`);
    assert.equal(unknown.status, 400, 'an unknown name is refused, never silently mapped to another diagram');
    assert.equal((await unknown.json()).error, 'bad_diagram');
  });
});

test('GET /api/info: mock by default, simulated always true, real disabled with the honest reason', async () => {
  await withServer(async (url) => {
    const j = await (await fetch(`${url}/api/info`)).json();
    assert.equal(j.source, 'mock');
    assert.equal(j.simulated, true);
    assert.equal(j.realAvailable, false);
    assert.match(j.realHint, /no live mode/);
    assert.equal(j.title, 'Agent Privilege — When to Use What');
    assert.match(j.version, /^\d+\.\d+\.\d+$/);
  });
});

test('POST /api/mode: exact body only, 409 with the reason when real is not enabled, both directions when it is', async () => {
  await withServer(async (url) => {
    const bad = await post(url, '/api/mode', { source: 'live' });
    assert.equal(bad.status, 400);
    const empty = await post(url, '/api/mode', {});
    assert.equal(empty.status, 400);
    const extra = await post(url, '/api/mode', { source: 'mock', extra: 1 });
    assert.equal(extra.status, 400);
    const real = await post(url, '/api/mode', { source: 'real' });
    assert.equal(real.status, 409);
    const rb = await real.json();
    assert.equal(rb.error, 'real_not_configured');
    assert.match(rb.detail, /no live mode/);
    const ok = await post(url, '/api/mode', { source: 'mock' });
    assert.equal(ok.status, 200);
  });
  await withServer(async (url) => {
    const on = await post(url, '/api/mode', { source: 'real' });
    assert.equal(on.status, 200);
    const info = await (await fetch(`${url}/api/info`)).json();
    assert.equal(info.source, 'real');
    assert.equal(info.simulated, true, 'real mode in this lab is still a simulation — the page keeps its banner');
    const back = await post(url, '/api/mode', { source: 'mock' });
    assert.equal((await back.json()).source, 'mock');
  }, { env: { APG_MODE_REAL: '1' } });
});

test('GET /api/runs and POST /api/reset are per workspace; a bad workspace id is 400', async () => {
  await withServer(async (url) => {
    const H = { 'x-workspace': 'visitor-a' };
    const runs = await (await fetch(`${url}/api/runs`, { headers: H })).json();
    assert.equal(runs.workspace, 'visitor-a');
    assert.deepEqual(runs.runs, []);

    const rs = await post(url, '/api/reset', {}, H);
    assert.equal(rs.status, 200);
    const rj = await rs.json();
    assert.equal(rj.reset, 'ok');
    assert.equal(rj.workspace, 'visitor-a');

    const badWs = await fetch(`${url}/api/runs`, { headers: { 'x-workspace': 'BAD WORKSPACE' } });
    assert.equal(badWs.status, 400);
    const badReset = await post(url, '/api/reset', {}, { 'x-workspace': 'a/b' });
    assert.equal(badReset.status, 400);
  });
});

test('safety: foreign Host is 403, cross-origin write is 403, 404s are JSON', async () => {
  await withServer(async (url) => {
    const cross = await fetch(`${url}/api/mode`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{}' });
    assert.equal(cross.status, 403);
    const nf = await fetch(`${url}/api/nope`);
    assert.equal(nf.status, 404);
    assert.equal((await nf.json()).error, 'not_found');
  });
  await withServer(async (url) => {
    const r = await rawHttp(`${url}/api/story`, { method: 'GET', headers: { Host: 'evil.example' } });
    assert.equal(r.status, 403);
  });
});

test('downstream failures are named: unknown diagram is 400, oversized body is 413 JSON (rule 23)', async () => {
  await withServer(async (url) => {
    const unknown = await fetch(`${url}/api/diagram?name=not-a-diagram`);
    assert.equal(unknown.status, 400);
    assert.equal((await unknown.json()).error, 'bad_diagram');
    const traversal = await fetch(`${url}/api/diagram?name=../safety`);
    assert.equal(traversal.status, 400);
    const big = await fetch(`${url}/api/mode`, { method: 'POST', headers: { 'content-type': 'application/json', origin: url }, body: JSON.stringify({ source: 'mock', pad: 'x'.repeat(100_000) }) });
    assert.equal(big.status, 413);
    assert.equal((await big.json()).error, 'payload_too_large');
  });
});

test('every diagram step walks its own edge: no two steps start on the same first edge, and the step text names the hop', async () => {
  for (const name of DIAGRAM_NAMES) {
    const raw = rawDiagram(name);
    const firsts = raw.steps.map((s) => s.edges[0]);
    assert.equal(new Set(firsts).size, firsts.length, `${name}: two steps start on the same edge — the walkthrough would repeat an arrow`);
    for (const s of raw.steps) {
      for (const ei of s.edges) {
        assert.ok(raw.edges[ei], `${name}: step "${s.title}" names missing edge ${ei}`);
      }
    }
  }
});
