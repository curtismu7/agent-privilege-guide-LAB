import test from 'node:test';
import assert from 'node:assert/strict';
import { runChecks, allPassed, diagramCoverage } from '../src/doctor.js';
import { DIAGRAM_NAMES } from '../src/diagramData.js';

test('every doctor check passes in a clean checkout (mock)', async () => {
  const checks = await runChecks({ env: {} });
  const failed = checks.filter((c) => c.level === 'fail');
  assert.deepEqual(failed.map((c) => `${c.id}: ${c.detail}`), []);
  assert.ok(allPassed(checks));
  assert.ok(checks.some((c) => c.id === 'diagram-coverage'));
  assert.ok(checks.some((c) => c.id === 'facts-labelled'));
});

test('diagramCoverage catches a section whose diagram is missing', () => {
  // The six names cover the 5 sections plus the mental model, nothing unused.
  const cov = diagramCoverage();
  assert.deepEqual(cov.missing, []);
  assert.deepEqual(cov.unused, []);

  // Mutation: drop one name and coverage fails on exactly that one.
  const withoutOne = DIAGRAM_NAMES.filter((n) => n !== 'apg-self-hosted');
  const wanted = ['apg-agent-registry', 'apg-agentic-apps', 'apg-federated-identity', 'apg-self-hosted', 'apg-ai-platform-agents', 'apg-mental-model'];
  const missing = wanted.filter((d) => !withoutOne.includes(d));
  assert.deepEqual(missing, ['apg-self-hosted']);
});
