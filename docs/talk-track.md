# Talk track

<!-- Generated from server/src/story.js by `npm run talk-track`. Do not edit by hand. -->

## What this page is

A field guide to the five sections of the PingOne Privilege Agent Privilege console area: what each one is, what it can do, when to reach for it, and how it maps to Workforce vs CIAM conversations. The three-layer mental model comes first: every "it doesn't work" ticket is a mismatch between two of the layers.

## Terminology

Terminology (Ping deck "ID4AI Workforce - H2 2026"): Federated Identity is the new display name for Non-Human Identity (NHI); Self-Hosted Agents was "NHI Agents Discovery & Enforcement"; AI Platform Agents was "Workload Agent Discovery & Control". The console API still uses NonHumanIdentity / nonhumanidentities — use the new names with people, the old names in code.

## The beats

1. **Start with the three layers.** Identity (what the agent is), Grant (what it may reach), Guardrail (what screens its traffic). Every "it doesn't work" ticket is a mismatch between two of them.
2. **Then discovery above.** Self-Hosted Agents and AI Platform Agents find the agents you did NOT onboard and attach enforcement — the ones you didn't control are still governed.
3. **Agent Registry is the default first stop.** One access key IS the agent: scopes, models, caps, expiry, guardrail, and reachable apps hang off it. Selecting apps on the key IS the grant.
4. **Agentic Apps are the doors.** MCP, A2A and LLM providers registered behind the agentless gateway. You cannot issue a grant without an app to point at.
5. **Federated Identity when a static secret is unacceptable.** Platform-issued JWTs — k8s, CI, SPIFFE, PingFederate — with issuer, audience, subject, lifetime and required-claims binding. Still needs a key behind it and a grant.
6. **Self-Hosted Agents finds shadow agents.** A sensor in Docker or Kubernetes discovers agent activity in your own estate and attaches allow/deny/step-up enforcement — including agents nobody registered.
7. **AI Platform Agents controls the boundary.** Hosted copilots and SaaS agent builders: discovery plus control of what platform agents reach when they cross into your estate.
8. **Close with the audience split.** Workforce: every agent gets identity, custodian, grant, guardrail. CIAM: the customer-facing assistant gets governed, budget-capped tool access — and the customer never presents a workload token.

## What to leave with

- **Workforce:** "Every agent gets an identity, a human custodian, a grant, and a guardrail — including the ones you didn't onboard yourself."
- **CIAM:** "Your customer-facing assistant gets governed, auditable, budget-capped access to tools and models — with per-agent guardrails in front of every call."

