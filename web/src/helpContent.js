// What the Help dialog says. Plain, and as hedged as the rest of the lab (rule 2): what was measured, what is simulated, what is UNVERIFIED.
export const HELP_SECTIONS = [
  {
    heading: "What this lab is",
    body: [
      "A guided tour of the five sections of the PingOne Privilege Agent Privilege console area — Agent Registry, Agentic Apps, Federated Identity, Self-Hosted Agents, AI Platform Agents — plus the Identity / Grant / Guardrail / Discovery mental model that ties them together.",
      "Each section gets: what it is, what it can do, when to reach for it (and when not), and how it maps to Workforce vs CIAM conversations. Six diagram-studio diagrams, one per section plus the mental model."
    ]
  },
  {
    heading: "What was measured, and what is UNVERIFIED",
    body: [
      "Measured (on a real console/gateway while writing the guide, and labelled 'measured' on the Facts tab): the NHI-plus-key pairing rule, the 'rebuilding 0 key(s)' gateway tell, the NonHumanIdentity API naming.",
      "UNVERIFIED (from Ping's 'ID4AI Workforce - H2 2026' deck, never tested on a tenant): Self-Hosted sensor mechanics, AI Platform Agents discovery channels, and the exact grant auto-creation flow. The Facts & Talk tab lists every claim with its measured/UNVERIFIED label.",
      "The lab states its own reading everywhere and never presents an untested claim as measured."
    ]
  },
  {
    heading: "How to use the page",
    body: [
      "Tabs: Mental model, Compare all five, one tab per console section (Agent Registry, Agentic Apps, Federated Identity, Self-Hosted, Platform Agents), Diagrams, Facts & Talk.",
      "Diagrams are ReactFlow: movable boxes, Simulate, Reset (restores box positions) and a speed control. On Facts & Talk you get the measured/UNVERIFIED list and the talk track.",
      "The header has the Mock/Real toggle, theme, Present (the P key toggles it), Talk track, version (opens release notes) and Reset (restores this workspace's recorded runs)."
    ]
  },
  {
    heading: "Mock and Real",
    body: "Mock-only by design: this lab is a guided tour, not a console client. There is no live engine and no live mode — it contacts no Privilege console, no gateway and no remote service in any mode. The 'Real' switch only changes the banner's label; the content is the same simulation either way, and nothing leaves your machine."
  }
];
