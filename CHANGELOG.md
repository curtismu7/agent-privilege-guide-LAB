# Changelog

## 0.1.0 (2026-11-18)

- New lab: a guided tour of the five PingOne Privilege Agent Privilege console sections — Agent Registry, Agentic Apps, Federated Identity, Self-Hosted Agents, AI Platform Agents — plus the Identity/Grant/Guardrail/Discovery mental model, one tab per section with use-when / don't-use-when and a Workforce-vs-CIAM map.
- Derived from the field guide `privilege/AGENT-PRIVILEGE-WHEN-TO-USE-WHAT.md` in AI-DEMO2, rewritten customer-neutral. Facts are labelled measured / inferred / UNVERIFIED; product behaviours taken only from the Ping deck "ID4AI Workforce - H2 2026" that were never tested stay UNVERIFIED (the Facts tab and a doctor check enforce the labelling).
- Six diagram-studio/1 diagrams (one per section plus the mental model), ReactFlow with movable boxes, Simulate, Reset and speed control; doctor fails on a section without a diagram.
- Eight-beat talk track (regenerated from the same story data the UI reads), presenter mode, doctor, per-workspace Reset.
- Mock-only by design: no live engine, zero outbound network in any mode (netguard with self-test); `APG_MODE_REAL=1` only enables the rule-19 Real switch and the page keeps its simulation banner. Per-visitor workspaces (rule 13).
- Port 7826 (one port, from the shelf allocator, 2026-11-18). Catalog id D134.
