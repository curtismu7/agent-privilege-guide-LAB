import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('the files the standalone rules ask for are present', () => {
  for (const f of ['README.md', 'CLAUDE.md', 'LICENSE', 'Dockerfile', 'docker-compose.yml', '.github/workflows/ci.yml', 'docs/talk-track.md', 'docs/safety.md', 'docs/shelf-entry.json', 'customer.config.example.json', 'content-pack.json', 'scripts/doctor.mjs', 'scripts/reset.mjs', 'scripts/check-no-ai-attribution.sh']) {
    assert.ok(fs.existsSync(path.join(root, f)), f);
  }
});

test('the shelf entry is valid and portable: relative composeFile, loopback url, health path', () => {
  const e = JSON.parse(read('docs/shelf-entry.json')).demos[0];
  assert.equal(e.id, 'agent-privilege-guide');
  assert.equal(e.kind, 'Demo');
  assert.equal(e.healthPath, '/api/health');
  assert.match(e.url, /^http:\/\/localhost:7826$/);
  assert.ok(!path.isAbsolute(e.composeFile), 'composeFile must be relative or a placeholder');
  assert.ok(!/\/Users\//.test(JSON.stringify(e)), 'no absolute home path');
});

test('the app identity is this lab, not the lab it came from: id, port, env prefix everywhere in the shipped tree', () => {
  assert.equal(JSON.parse(read('package.json')).name, 'agent-privilege-guide');
  const skip = new Set(['node_modules', 'dist', '.git', 'package-lock.json', 'CHANGELOG.md', 'content-pack.json']);
  const hits = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      if (skip.has(name)) continue;
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (!p.endsWith('repo.test.mjs')) {
        const t = fs.readFileSync(p, 'utf8');
        if (/intent-console|int-console-lab|\bINTC_\b|\b7825\b/.test(t)) hits.push(path.relative(root, p));
      }
    }
  };
  walk(root);
  assert.deepEqual(hits, [], 'no identifier of the source lab survives');
});

test('no AI-attribution credit anywhere in the tree (owner rule 2026-11-07)', () => {
  const skip = new Set(['node_modules', 'dist', '.git', 'package-lock.json', 'scripts']);
  const pat = /[G]enerated with \[?[Cc]laude [Cc]ode|[Cc]o-[Aa]uthored-[Bb]y:/;
  const hits = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      if (skip.has(name)) continue;
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (pat.test(fs.readFileSync(p, 'utf8'))) hits.push(path.relative(root, p));
    }
  };
  walk(root);
  assert.deepEqual(hits, []);
  const out = execFileSync('bash', ['scripts/check-no-ai-attribution.sh'], { cwd: root, encoding: 'utf8' });
  assert.match(out, /tracked files with an AI-attribution credit: 0/);
});

test('the one port is 7826 and compose publishes it on 127.0.0.1 only', () => {
  const compose = read('docker-compose.yml');
  assert.match(compose, /"127\.0\.0\.1:\$\{HOST_PORT:-7826\}:7826"/);
  for (const bad of ['"7826:7826"', '"0.0.0.0:', '":7826"']) assert.ok(!compose.includes(`- ${bad}`), bad);
  assert.equal([...compose.matchAll(/127\.0\.0\.1:/g)].length >= 1, true);
});

test('the vendored shared components carry pin files, and the pins match the copies', () => {
  for (const pin of ['scripts/standalone-ui.sha256', 'web/src/top-menu/top-menu.sha256', 'web/src/top-menu/top-menu.css.sha256']) {
    assert.ok(fs.existsSync(path.join(root, pin)), pin);
  }
  const pinValue = (p) => read(p).trim().split(/\s+/)[0];
  const hash = (p) => execFileSync('shasum', ['-a', '256', path.join(root, p)], { encoding: 'utf8' }).split(' ')[0];
  assert.equal(hash('web/src/top-menu/TopMenu.jsx'), pinValue('web/src/top-menu/top-menu.sha256'), 'TopMenu.jsx matches its pin');
  assert.equal(hash('web/src/top-menu/top-menu.css'), pinValue('web/src/top-menu/top-menu.css.sha256'), 'top-menu.css matches its pin');
  assert.equal(hash('web/src/standalone-ui.css'), pinValue('scripts/standalone-ui.sha256'), 'standalone-ui.css matches its pin');
});

test('customer.config.json is git-ignored, and its example only sets the four cast values', () => {
  assert.match(read('.gitignore'), /^customer\.config\.json$/m);
  assert.deepEqual(Object.keys(JSON.parse(read('customer.config.example.json')).cast).sort(), ['agentId', 'brand', 'clientId', 'host']);
});

test('no shipped text names a real customer, company or tenant', () => {
  const skip = new Set(['node_modules', 'dist', '.git', 'package-lock.json']);
  const hits = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      if (skip.has(name)) continue;
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (!['repo.test.mjs', 'story.test.js', 'content-pack.test.mjs'].some((n) => p.endsWith(n))) {
        const t = fs.readFileSync(p, 'utf8').toLowerCase();
        for (const w of ['united airlines', 'mileageplus', 'datapower', 'optum', 'unitedhealth', 'uhg', 'member benefit', 'personal-agent', 'personal agent']) if (t.includes(w)) hits.push(`${path.relative(root, p)}: ${w}`);
      }
    }
  };
  walk(root);
  assert.deepEqual(hits, []);
});
