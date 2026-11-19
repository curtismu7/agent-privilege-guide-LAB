# Agent Privilege Field Guide LAB

Tier: Demo.
Repo: https://github.com/curtismu7/agent-privilege-guide-LAB

A guided tour of the five sections of the PingOne Privilege **Agent Privilege** console area — **Agent Registry, Agentic Apps, Federated Identity, Self-Hosted Agents, AI Platform Agents** — plus the **Identity / Grant / Guardrail / Discovery** mental model that ties them together. Each section gets: what it is, what it can do, when to reach for it (and when not), and how it maps to Workforce vs CIAM conversations. Six diagram-studio diagrams (one per section plus the mental model).

Catalog id **D134** (allocated 2026-11-18).

## Source and honesty

- **Derived from** the field guide `privilege/AGENT-PRIVILEGE-WHEN-TO-USE-WHAT.md` in the AI-DEMO2 repo, rewritten customer-neutral: no tenant, customer or hostname from any real environment ships in this lab.
- **Measured facts** carry a `measured` label (observed on a real console/gateway while writing the guide: the NHI-plus-key pairing rule, the "rebuilding 0 key(s)" gateway tell, the NonHumanIdentity API naming).
- Product behaviours taken only from the Ping deck **"ID4AI Workforce - H2 2026"** that were never tested on a tenant are labelled **UNVERIFIED** (see the Facts tab): Self-Hosted sensor mechanics, AI Platform Agents discovery channels, the exact grant auto-creation flow. The lab states its own reading everywhere; it never presents an untested claim as measured.

## Run it

Prerequisite: Node 26+ (Docker form needs Docker/OrbStack only). Mock mode needs no tenant and no credentials.

```
npm install
npm run build
npm test
npm start            # serves http://127.0.0.1:7826/
npm run doctor       # preflight: port free, mode, netguard self-test, diagram coverage
npm run reset        # reset the current workspace's recorded runs
```

Docker (OrbStack, published on `127.0.0.1` only):

```
docker compose up -d --build
```

Through the shared lab-proxy: `https://local.ping-devops.com:8443/agent-privilege-guide/` once the route is registered.

## Ports

- The lab listens on **7826 only** (one host port per app). Docker publishes `127.0.0.1:7826:7826` only — loopback, never a wildcard bind.
- If 7826 is taken: `lsof -iTCP:7826 -sTCP:LISTEN -n -P`, stop the offender (an old `npm start` process or this lab's own container via `docker compose down`), then start again. The lab refuses any other port on purpose; free 7826 rather than moving the lab.

## Mock / Real

**Mock-only by design.** This lab is a guided tour, not a console client: there is **no live engine and no live mode**. It contacts no Privilege console, no gateway and no remote service in any mode — the netguard refuses every non-loopback socket, with a self-test and a test asserting zero attempts.

What "Real" means here: with `APG_MODE_REAL=1` in the lab's own `.env`, the rule-19 header switch can report `real`, and `GET /api/info` then shows `source: "real"` — but the content is the same simulation either way (`REAL MODE` banner says so). Real is never configured by default; the switch answers 409 with the reason until you opt in, and `MODE=mock` in `.env` forces the start mode. `POST /api/mode` takes exactly `{source:"mock"|"real"}` and switches at runtime, no restart.

## API

`GET /api/story` (all page text), `GET /api/diagrams` and `GET /api/diagram?name=apg-*` (six diagram-studio/1 documents), `GET /api/info` (mode, `source`, `realAvailable`, version), `POST /api/mode` (rule-19 toggle), `GET /api/runs` and `POST /api/reset` (per workspace), `GET /api/health` (`demo-health/1`), `GET /api/shelf` (link to the shelf).

Per-visitor workspaces: every browser carries an `X-Workspace` id; recorded runs and state are per workspace and Reset restores that workspace only.

## What is simulated

Everything is text, diagrams and canned state: no console session, no API call, no token, no credential. All hosts in shipped text end in `.example`/`.invalid`; any key-looking value is an obviously fake `sk-MOCK-…` string. No tenant, no customer identifier, no live system is touched — nothing here is connected to any Ping environment.

## Tabs

**Mental model** (the four layers: Identity, Grant, Guardrail, plus Discovery above them), one tab per console section (**Agent Registry, Agentic Apps, Federated Identity, Self-Hosted, Platform Agents**) with its use-when / don't-use-when and Workforce-vs-CIAM card, **Diagrams** (all six, ReactFlow, movable boxes, Simulate, Reset, speed control), **Facts & Talk** (every claim with its measured/UNVERIFIED label, the talk track). Presenter mode (key `P`) and the Mock/Real toggle keep the simulation banner.

Safety: loopback bind only (plus `LAB_ALLOWED_HOSTS`), Host check, same-origin writes, netguard with self-test, bounded input, `nosniff`, non-root read-only container. See `docs/safety.md` and `docs/talk-track.md` (generated from the same data the UI reads).

## Attribution

Scaffold (server shell, safety, workspaces, diagram viewer, packaging) from the family's standard standalone scaffold; the field-guide content is derived from AI-DEMO2's `privilege/AGENT-PRIVILEGE-WHEN-TO-USE-WHAT.md`, rewritten customer-neutral. No code or identifier was imported across repos.
