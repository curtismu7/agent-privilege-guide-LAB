// The six diagrams are diagram-studio/1 DATA (server/diagrams/*.json), loaded by name and checked
// with the studio's own validator copy. Nothing here builds nodes or edges by hand.
import fs from 'node:fs';
import { fillDeep } from './cast.js';
import { validateDiagram } from './diagramStudioValidate.js';

const DIR = new URL('../diagrams/', import.meta.url);
export const DIAGRAM_NAMES = ['apg-mental-model', 'apg-agent-registry', 'apg-agentic-apps', 'apg-federated-identity', 'apg-self-hosted', 'apg-ai-platform-agents'];

export function loadDiagram(name) {
  const doc = JSON.parse(fs.readFileSync(new URL(`${name}.json`, DIR), 'utf8'));
  const problems = validateDiagram(doc);
  if (problems.length) throw new Error(`diagram ${name} is not valid diagram-studio/1: ${problems.join('; ')}`);
  return doc;
}
const DOCS = Object.fromEntries(DIAGRAM_NAMES.map((n) => [n, loadDiagram(n)]));
export const rawDiagram = (name = DIAGRAM_NAMES[0]) => DOCS[name];

export function buildDiagram(cast, name = DIAGRAM_NAMES[0]) {
  const d = fillDeep(DOCS[name] || DOCS[DIAGRAM_NAMES[0]], cast);
  // A box with no incoming arrows only acts; a box with no outgoing arrows is an endpoint.
  // The role goes into `sub` (a short line under the label) and the group label into the title
  // attribute, so the box explains itself at a glance, not only when clicked.
  const out = new Set(), inn = new Set();
  for (const e of d.edges) { out.add(e.source); inn.add(e.target); }
  return {
    title: d.title,
    intro: d.lede,
    groups: Object.fromEntries(Object.entries(d.groups).map(([k, g]) => [k, g.label])),
    nodes: d.nodes.map((n) => {
      const role = !inn.has(n.id) ? `${d.groups[n.group]?.label ?? n.group} — acts` : !out.has(n.id) ? `${d.groups[n.group]?.label ?? n.group} — outcome` : d.groups[n.group]?.label ?? n.group;
      return { id: n.id, label: n.label, kind: n.group, x: n.x, y: n.y, role, ...(n.sub ? { sub: n.sub } : {}) };
    }),
    steps: d.steps.map((s) => { const e = d.edges[s.edges[0]]; return { from: e.source, to: e.target, label: s.title, say: s.what }; }),
  };
}
