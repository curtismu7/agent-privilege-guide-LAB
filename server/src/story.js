// All page text in one place, from the field guide "Agent Privilege — When to Use What".
// Facts carry a status: measured (we did it on a real system), inferred (the doc says it, we saw
// consistent evidence) or UNVERIFIED (we never tested it). A doctor check fails on any fact with no
// status, and on any use-case that does not point where the guide says it points.
export const TITLE = 'Agent Privilege — When to Use What';
export const INTRO = 'A field guide to the five sections of the PingOne Privilege Agent Privilege console area: what each one is, what it can do, when to reach for it, and how it maps to Workforce vs CIAM conversations. The three-layer mental model comes first: every "it doesn\'t work" ticket is a mismatch between two of the layers.';
export const BANNER = 'SIMULATION: this lab is a guided tour, not a console. Every page text is drawn from the field guide; product behaviours the guide does not source are labelled UNVERIFIED. No tenant, no outbound network, no credentials. For education.';
export const REAL_BANNER = 'REAL MODE: this lab reads no live system in real mode either — it has no live engine. Real mode only means the mode switch reports "real"; the content is the same simulation.';

export const TERMINOLOGY = 'Terminology (Ping deck "ID4AI Workforce - H2 2026"): Federated Identity is the new display name for Non-Human Identity (NHI); Self-Hosted Agents was "NHI Agents Discovery & Enforcement"; AI Platform Agents was "Workload Agent Discovery & Control". The console API still uses NonHumanIdentity / nonhumanidentities — use the new names with people, the old names in code.';

export const SECTIONS = [
  {
    id: 'agent-registry',
    n: 1,
    name: 'Agent Registry',
    tagline: 'Agent access keys',
    what: 'The place you mint an agent\'s identity. An access key is one credential that IS the agent: scopes (llm / mcp / a2a), allowed models, RPM/TPM/budget, expiry, guardrail, and reachable apps all hang off the key. The agent sends Authorization: Bearer <key> — no sign-in, no token exchange.',
    can: [
      'Give each agent its own identity with a custodian (the human it acts as — policy is issued to the custodian; if their account goes inactive, the key stops working).',
      'Gate by scope and app: selecting apps on the key IS the grant — saving auto-creates a policy. For MCP apps the grant can list tools; the rest are hidden and refused.',
      'For LLM keys: one provider per key, model allowlist, rate and budget caps; Privilege holds the real provider key and injects it server-side, so the agent only holds a virtual key.',
      'Per-key AI Guard (runtime protection step), rate limiting enforced natively at the gateway.',
      'Revoke (Revoked: true) as the instant non-destructive kill; expiry for lifecycle.',
    ],
    useWhen: 'You are building or onboarding your own agents and want governed access to models, MCP servers, and A2A agents — the default starting point for nearly every agent deployment.',
    dontUseWhen: 'You can\'t accept any static secret (a key IS a static secret) — use Federated Identity instead.',
    workforce: 'Primarily workforce / enterprise IT: internal AI agents, developer-built automations, and service accounts with a named human custodian answering for them. In CIAM it appears where a customer-facing AI agent (support copilot, in-app assistant) calls back-end tools on the user\'s behalf — but the governance, budgeting, and custodian model are enterprise-shaped.',
    ciam: 'Only for the customer-facing assistant\'s tool access; governance stays enterprise-shaped.',
    workforceWeight: 'core',
    diagram: 'apg-agent-registry',
  },
  {
    id: 'agentic-apps',
    n: 2,
    name: 'Agentic Apps',
    tagline: 'The resource layer — the doors',
    what: 'The resource layer — the things agents reach: registered MCP apps (/<app>/mcp), A2A agents (/<app>/a2a/...), and LLM providers fronted by the AI Gateway.',
    can: [
      'Register MCP servers and A2A agents behind the agentless gateway, with auth modes (Static Token vs Pass Agent Token), tool lists, and guardrails.',
      'Aggregate apps (compose several backends behind one door).',
      'Serve as the target of grants: a key or federated identity is authorized per-app (and per-tool).',
    ],
    useWhen: 'You are exposing any MCP server, A2A agent, or LLM provider to agents — you cannot issue a grant without an app to point at.',
    workforce: 'Same split as the registry: mostly workforce (internal tool surfaces), plus CIAM where the app is a customer-facing assistant\'s tool backend.',
    ciam: 'The assistant\'s back-end tool apps.',
    workforceWeight: 'core',
    diagram: 'apg-agentic-apps',
  },
  {
    id: 'federated-identity',
    n: 3,
    name: 'Federated Identity',
    tagline: 'Secretless agents (NonHumanIdentity)',
    what: 'An external token issuer an agent authenticates against instead of holding a key: expected iss, mandatory aud bound to a specific door, subject pinning, JWKS URI, max token lifetime, and required claims. The agent presents a platform-issued JWT (Kubernetes service account, GitHub Actions OIDC token, SPIFFE, PingFederate-issued token…); there is no secret to leak, rotate, or accidentally commit.',
    can: [
      'Bind trust to a specific platform and even a specific workload (e.g. RequiredClaims = GitHub repository + workflow).',
      'Cap token lifetime (rejects tokens whose exp - iat exceeds the limit — necessary because self-signing workloads choose their own exp).',
      'Gate grants on token claims (PolicyRule.RequiredClaims — e.g. act.sub must equal the agent id for on-behalf-of flows).',
      'Back an agent key: a key whose custodian is the NHI authenticates with the federated token — never both a key-level WorkloadIdentity AND an NHI custodian (the API refuses).',
    ],
    useWhen: 'The agent already has a platform identity you trust (k8s pod, CI job, PF-issued token), security requires zero static credentials, or you need claim-level binding (which key, which repo, which human delegated). The default for anything Kubernetes- or CI-hosted.',
    caveat: 'An NHI does not authenticate anyone by itself — it needs a key behind it (watch for the gateway log tell "rebuilding 0 key(s)") and a grant.',
    workforce: 'Workforce / infrastructure through and through: platform engineers, DevOps pipelines, service meshes. CIAM rarely issues workload tokens for end customers — if a customer-facing agent needs user identity, that flows as user context on the call, not as an NHI.',
    ciam: 'Rare — customers don\'t present workload tokens.',
    workforceWeight: 'core',
    diagram: 'apg-federated-identity',
  },
  {
    id: 'self-hosted-agents',
    n: 4,
    name: 'Self-Hosted Agents',
    tagline: 'Discovery & enforcement for your own estate',
    what: 'Discovery and enforcement for agents you run yourself in your own infrastructure. A sensor (Docker or Kubernetes) discovers agent activity in the environment, reports it to Privilege, and enforces policies on it.',
    can: [
      'Find agents nobody registered — shadow agents — and surface them for governance.',
      'Attach enforcement policies to discovered agents (SENSOR-ENFORCEMENT-POLICIES): allow/deny/step-up on what they may do.',
      'Pair with the sensor identity story (a signing key the sensor mints; workload-identity-backed where possible).',
    ],
    useWhen: 'The customer has agents running in their own VMs, containers, or clusters that weren\'t onboarded through the registry — the "find and control what\'s already there" motion.',
    workforce: 'Almost purely workforce / enterprise: shadow AI in the corporate estate is a workforce-security problem.',
    ciam: 'Not applicable.',
    workforceWeight: 'core',
    diagram: 'apg-self-hosted',
  },
  {
    id: 'ai-platform-agents',
    n: 5,
    name: 'AI Platform Agents',
    tagline: 'Discovery & control for platform-hosted agents',
    what: 'Discovery and control for agents running inside third-party AI platforms (hosted copilots, managed agent runtimes) — workloads whose identity and runtime belong to a platform, not to the customer\'s infrastructure.',
    can: [
      'Discover agent activity emitted by AI platforms and bring it under the same policy model.',
      'Control what platform-hosted agents may reach when they cross into the customer\'s estate (tools, data, models via the gateway).',
    ],
    useWhen: 'The customer has adopted external AI platforms (Copilot-class tools, SaaS agent builders) and wants visibility and control over what those agents do against enterprise resources.',
    workforce: 'Workforce: these are employee-facing platform agents. The CIAM-adjacent concern is only at the boundary — what a platform agent may access on behalf of a user.',
    ciam: 'Boundary control only.',
    workforceWeight: 'core',
    diagram: 'apg-ai-platform-agents',
  },
];

export const MENTAL_MODEL = {
  intro: 'Three layers, and every "it doesn\'t work" ticket is a mismatch between two of them. Then, above the layers you control yourself, discovery finds what you didn\'t onboard.',
  layers: [
    { n: 1, name: 'Identity', text: 'What the agent is. An agent access key (Agent Registry) or a federated/workload identity (Federated Identity). No identity, no call.' },
    { n: 2, name: 'Grant', text: 'What the agent may reach. Created automatically when you select an Agentic App on a key, or authored as a policy (pacpolicys) for federated identities. Scoped to MCP tools, A2A agents, or LLM providers/models.' },
    { n: 3, name: 'Guardrail', text: 'What screens the agent\'s traffic. Per-key AI Guard, runtime protection, and the sensor/enforcement layer for discovered agents.' },
    { n: 4, name: 'Discovery', text: 'What agents exist that you don\'t control. Self-Hosted Agents and AI Platform Agents find them and attach enforcement.' },
  ],
  diagram: 'apg-mental-model',
};

// The guide's one-line pitch per audience, and the Workforce vs CIAM summary table.
export const PITCHES = [
  { audience: 'Workforce', line: '"Every agent gets an identity, a human custodian, a grant, and a guardrail — including the ones you didn\'t onboard yourself."' },
  { audience: 'CIAM', line: '"Your customer-facing assistant gets governed, auditable, budget-capped access to tools and models — with per-agent guardrails in front of every call."' },
];

export const SUMMARY_TABLE = {
  columns: ['', 'Workforce', 'CIAM'],
  rows: [
    { row: 'Who the agent acts as', workforce: 'An employee (custodian) or a workload', ciam: 'An end customer (user context on calls)' },
    { row: 'Agent Registry', workforce: 'Core: internal agents with human custodians, budgets, guardrails', ciam: 'Only for the customer-facing assistant\'s tool access; governance stays enterprise-shaped' },
    { row: 'Agentic Apps', workforce: 'Internal MCP/A2A/LLM surfaces', ciam: 'The assistant\'s back-end tool apps' },
    { row: 'Federated Identity', workforce: 'Core: k8s/CI/PF workload tokens, zero static secrets', ciam: 'Rare — customers don\'t present workload tokens' },
    { row: 'Self-Hosted Agents', workforce: 'Core: shadow-agent discovery in the corporate estate', ciam: 'Not applicable' },
    { row: 'AI Platform Agents', workforce: 'Core: Copilot-class platform agents', ciam: 'Boundary control only' },
  ],
};

export const FACTS = [
  { id: 'guide-source', status: 'measured', text: 'The five sections, their capabilities and the Workforce/CIAM mapping come from the field guide "Agent Privilege — When to Use What", written against the PingOne Privilege console area and the Ping deck "ID4AI Workforce - H2 2026".' },
  { id: 'terminology', status: 'measured', text: 'The console API still uses NonHumanIdentity / nonhumanidentities; Federated Identity, Self-Hosted Agents and AI Platform Agents are the display names (deck "ID4AI Workforce - H2 2026").' },
  { id: 'nhi-key-pairing', status: 'measured', text: 'A key whose custodian is an NHI authenticates with the federated token, and the API refuses a key that sets both a key-level WorkloadIdentity and an NHI custodian — observed while configuring a federated agent caller.' },
  { id: 'rebuilding-zero-keys', status: 'measured', text: 'The gateway log tell "rebuilding 0 key(s)" appears when an NHI exists with no key behind it — observed on a live gateway.' },
  { id: 'deck-claims', status: 'UNVERIFIED', text: 'Product behaviours taken only from the Ping deck (Self-Hosted sensor mechanics, AI Platform Agents discovery channels, the exact grant auto-creation flow) are UNVERIFIED on our tenant unless a fact above says otherwise.' },
  { id: 'console-api', status: 'UNVERIFIED', text: 'The console route and payload shapes for these five sections are not reproduced here; this lab is a guide, not a console simulator.' },
];

// The talk track, one step per page beat. Presenter mode reads it; the pop-out dialog renders it.
export const TALK_TRACK = [
  { title: 'Start with the three layers', say: 'Identity (what the agent is), Grant (what it may reach), Guardrail (what screens its traffic). Every "it doesn\'t work" ticket is a mismatch between two of them.' },
  { title: 'Then discovery above', say: 'Self-Hosted Agents and AI Platform Agents find the agents you did NOT onboard and attach enforcement — the ones you didn\'t control are still governed.' },
  { title: 'Agent Registry is the default first stop', say: 'One access key IS the agent: scopes, models, caps, expiry, guardrail, and reachable apps hang off it. Selecting apps on the key IS the grant.' },
  { title: 'Agentic Apps are the doors', say: 'MCP, A2A and LLM providers registered behind the agentless gateway. You cannot issue a grant without an app to point at.' },
  { title: 'Federated Identity when a static secret is unacceptable', say: 'Platform-issued JWTs — k8s, CI, SPIFFE, PingFederate — with issuer, audience, subject, lifetime and required-claims binding. Still needs a key behind it and a grant.' },
  { title: 'Self-Hosted Agents finds shadow agents', say: 'A sensor in Docker or Kubernetes discovers agent activity in your own estate and attaches allow/deny/step-up enforcement — including agents nobody registered.' },
  { title: 'AI Platform Agents controls the boundary', say: 'Hosted copilots and SaaS agent builders: discovery plus control of what platform agents reach when they cross into your estate.' },
  { title: 'Close with the audience split', say: 'Workforce: every agent gets identity, custodian, grant, guardrail. CIAM: the customer-facing assistant gets governed, budget-capped tool access — and the customer never presents a workload token.' },
];

export function buildStory() {
  return { title: TITLE, intro: INTRO, banner: BANNER, realBanner: REAL_BANNER, terminology: TERMINOLOGY, sections: SECTIONS, mentalModel: MENTAL_MODEL, pitches: PITCHES, summaryTable: SUMMARY_TABLE, facts: FACTS, talkTrack: TALK_TRACK };
}
export const rawStory = buildStory;
