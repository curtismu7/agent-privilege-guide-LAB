// Builds content-pack.json for the Learning Hub from the story data, so the pack cannot drift from the lab.
//   node scripts/build-content-pack.mjs        (writes content-pack.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStory } from '../server/src/story.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const sid = (n) => `S${String(n).padStart(2, '0')}`;

export function buildPack() {
  const story = buildStory();
  // One glossary term per guide concept; cards teach them.
  const terms = {
    'agent-registry': ['agent-access-key'], 'agentic-apps': ['agentic-apps'],
    'federated-identity': ['federated-identity'], 'self-hosted-agents': ['self-hosted-agents'],
    'ai-platform-agents': ['ai-platform-agents'], 'mental-model': ['mental-model'],
  };
  return {
    schema: 'demo-content-pack/1',
    id: 'agent-privilege-guide',
    title: 'Agent Privilege Field Guide',
    version,
    demo: { id: 'agent-privilege-guide', name: 'Agent Privilege Field Guide', catalog: 'D134', baseUrl: 'http://localhost:7826', doctor: '/api/health', tags: ['pingone-privilege', 'ai-agent-security', 'agent-governance', 'nonhuman-identity', 'mock-only'] },
    glossary: [
      { id: 'mental-model', term: 'Three-layer mental model', definition: story.mentalModel.layers.map((l) => `${l.name}: ${l.text}`).join(' '), aliases: ['layers'] },
      { id: 'agent-access-key', term: 'Agent access key', definition: 'One credential that IS the agent: scopes, allowed models, rate/budget caps, expiry, guardrail and reachable apps hang off the key; sent as a Bearer header, no sign-in, no token exchange.', aliases: ['access-key', 'agent key'] },
      { id: 'agentic-apps', term: 'Agentic Apps', definition: 'The resource layer: MCP servers, A2A agents and LLM providers registered behind the agentless gateway. Selecting an app on a key IS the grant — you cannot issue a grant without an app to point at.', aliases: ['resource layer'] },
      { id: 'federated-identity', term: 'Federated Identity', definition: 'A secretless agent identity: a platform-issued JWT (k8s, CI, SPIFFE, PingFederate) with issuer, audience, subject pinning, lifetime cap and required claims — the new display name for NonHumanIdentity (NHI).', aliases: ['NHI', 'NonHumanIdentity', 'workload identity'] },
      { id: 'self-hosted-agents', term: 'Self-Hosted Agents', definition: 'Discovery and enforcement for agents in your own infrastructure: a sensor finds shadow agents and attaches allow/deny/step-up policies.', aliases: ['sensor'] },
      { id: 'ai-platform-agents', term: 'AI Platform Agents', definition: 'Discovery and control for agents inside third-party AI platforms (Copilot-class), at the boundary where they cross into your estate.', aliases: ['platform agents'] },
    ],
    sources: [
      { id: 'field-guide', title: 'Field guide "Agent Privilege — When to Use What" (and the Ping deck "ID4AI Workforce - H2 2026")', url: 'https://field-guide.invalid/agent-privilege', kind: 'product-doc', use: 'The five console sections, their capabilities and the Workforce/CIAM mapping.', status: 'read', checked: '2026-11-18' },
    ],
    cards: [
      { id: 'concept-mental-model', label: 'Start: the three layers (plus discovery)', description: story.mentalModel.intro, group: 'concept', action: { type: 'route', href: '/#mental-model' }, terms: terms['mental-model'] },
      ...story.sections.map((s) => ({
        id: `section-${s.id}`,
        label: `${s.n}. ${s.name} — ${s.tagline}`,
        description: s.useWhen,
        group: 'concept',
        action: { type: 'route', href: `/#${s.id}` },
        terms: terms[s.id] || [],
        story: sid(s.n),
      })),
      { id: 'ref-facts', label: 'Facts and what is UNVERIFIED', description: 'Every claim carries a status: measured, inferred or UNVERIFIED.', group: 'reference', action: { type: 'route', href: '/#facts' } },
      { id: 'ref-doctor', label: 'Doctor and health', description: 'Preflight checks and the demo-health/1 endpoint.', group: 'setup', action: { type: 'route', href: '/api/health' } },
    ],
    stories: story.sections.map((s) => ({ id: sid(s.n), title: s.name, say: s.what })),
    documents: [
      { id: 'talk-track', path: 'docs/talk-track.md', title: 'Talk track (generated from the story data)' },
    ],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(ROOT, 'content-pack.json'), `${JSON.stringify(buildPack(), null, 2)}\n`);
}
