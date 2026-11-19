import React, { useEffect, useRef } from "react";

// ReleaseNotes: what the version button opens. This lab's own notes — the shared
// top-menu copy is a placeholder, so labs pass onVersion and render this instead.
export default function ReleaseNotes({ version, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="rn-backdrop" data-testid="release-notes">
      <dialog className="rn-dialog" open aria-label={`Release notes for version ${version}`}>
        <h2>Agent Privilege Field Guide {version}</h2>
        <ul>
          <li><strong>The five console sections, one page each.</strong> Agent Registry, Agentic Apps, Federated Identity, Self-Hosted Agents and AI Platform Agents: what it is, what it can do, when to reach for it, and the Workforce vs CIAM split — from the field guide "Agent Privilege — When to Use What".</li>
          <li><strong>The three-layer mental model.</strong> Identity, Grant, Guardrail — plus discovery above them — as the first tab, with the guide's claim that every "it doesn't work" ticket is a mismatch between two layers.</li>
          <li><strong>Six diagram-studio diagrams.</strong> One per section plus the layer model, loaded by name from diagram-studio/1 data with Simulate, Reset, speed control and movable boxes.</li>
          <li><strong>Honest labelling.</strong> Every fact is measured, inferred or UNVERIFIED; product behaviours taken only from the Ping deck are labelled, never asserted.</li>
          <li><strong>Rule-19 Mock/Real toggle.</strong> Mock-only by design: the netguard refuses every non-loopback call, Real is disabled with a reason, and per-visitor workspaces keep one visitor's state off another's.</li>
        </ul>
        <p className="rn-close"><button ref={closeRef} type="button" onClick={onClose}>Close</button></p>
      </dialog>
    </div>
  );
}
