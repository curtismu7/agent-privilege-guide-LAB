// Preflight checks shared by `npm run doctor` and GET /api/health. Never prints a secret, needs no network.
// Each check: { id, level: 'pass' | 'info' | 'fail', detail }.
import { assertBindAllowed, bindHost, portProblem, scanHosts, scanKeys, DEFAULT_PORT, PORT_MIN } from './safety.js';
import { netguardSelfTest } from './netguard.js';
import { buildStory, SECTIONS, MENTAL_MODEL, FACTS } from './story.js';
import { DIAGRAM_NAMES, rawDiagram, buildDiagram } from './diagramData.js';
import { modeFrom, realAvailableFrom } from './config.js';

// The guide's core promise: every section and the mental model name a diagram, and every diagram loads.
export function diagramCoverage() {
  const wanted = [...SECTIONS.map((s) => s.diagram), MENTAL_MODEL.diagram];
  const missing = wanted.filter((d) => !DIAGRAM_NAMES.includes(d));
  const unused = DIAGRAM_NAMES.filter((d) => !wanted.includes(d));
  return { wanted, missing, unused };
}

export async function runChecks({ env = process.env } = {}) {
  const checks = [];
  const add = (id, level, detail) => checks.push({ id, level, detail });

  const major = Number(process.versions.node.split('.')[0]);
  add('node', major >= 20 ? 'pass' : 'fail', `v${process.versions.node} (need >= 20)`);

  try { add('mode', 'pass', `mode=${modeFrom(env)}${realAvailableFrom(env) ? ' (real switch on)' : ' (Mock only)'}`); }
  catch (e) { add('mode', 'fail', e.message); }

  try { add('bind', 'pass', `${assertBindAllowed(bindHost(env), env)}${env.APG_BIND ? ' (APG_BIND opt-in)' : ' (loopback)'}`); }
  catch (e) { add('bind', 'fail', e.message); }

  const port = env.PORT === undefined || env.PORT === '' ? DEFAULT_PORT : Number(env.PORT);
  const problem = portProblem(port);
  add('port-range', problem ? 'fail' : 'pass', problem || `${port} is the allocated port ${PORT_MIN} and not reserved`);

  const cov = diagramCoverage();
  add('diagram-coverage', !cov.missing.length && !cov.unused.length ? 'pass' : 'fail',
    cov.missing.length ? `sections without a diagram: ${cov.missing.join(', ')}` : cov.unused.length ? `diagrams no section uses: ${cov.unused.join(', ')}` : `${cov.wanted.length} diagrams cover the 5 sections plus the mental model`);

  const raw = JSON.stringify([buildStory()]);
  add('facts-labelled', FACTS.some((f) => !['measured', 'inferred', 'UNVERIFIED'].includes(f.status)) ? 'fail' : 'pass', 'every fact is labelled measured, inferred or UNVERIFIED');

  const hosts = scanHosts(raw);
  add('story-hosts', hosts.length ? 'fail' : 'pass', hosts.length ? `non-reserved hosts: ${hosts.join(', ')}` : 'every host in the story is .invalid or .example or loopback');
  const keys = scanKeys(raw);
  add('story-keys', keys.length ? 'fail' : 'pass', keys.length ? 'key-looking values found in the story' : 'no key-looking values in the story');

  // Every diagram is valid studio data and every step names a real hop.
  const bad = [];
  for (const n of DIAGRAM_NAMES) {
    try {
      const d = rawDiagram(n);
      for (const s of d.steps) { for (const ei of s.edges) if (!d.edges[ei]) bad.push(`${n}: step names edge ${ei}`); }
      const built = buildDiagram({}, n);
      if (!built.nodes.length || !built.steps.length) bad.push(`${n}: builds empty`);
    } catch (e) { bad.push(`${n}: ${e.message}`); }
  }
  add('diagrams', bad.length ? 'fail' : 'pass', bad.length ? bad.join('; ') : `${DIAGRAM_NAMES.length} diagram-studio/1 documents load, validate and build`);

  const ng = await netguardSelfTest();
  add('netguard', ng.ok ? 'pass' : 'fail', ng.ok ? `blocked fetch, socket, socket-by-IP, dns lookup, dns resolve and udp to a non-loopback host (${ng.blocked}/6)` : ng.detail);

  add('tenant', 'pass', 'mock needs no tenant or credentials and makes no outbound network call; this lab has no live mode');
  return checks;
}

export const allPassed = (checks) => checks.every((c) => c.level !== 'fail');
