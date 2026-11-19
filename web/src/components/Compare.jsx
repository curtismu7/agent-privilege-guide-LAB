import { useMemo, useState } from "react";

// Compare all five sections side by side. Audience filter: All / Workforce / CIAM — the CIAM
// view shows only what the guide says matters to that audience, so a customer-facing conversation
// never has to read past the workforce rows.
const AUDIENCES = [
  { id: "all", label: "All" },
  { id: "workforce", label: "Workforce" },
  { id: "ciam", label: "CIAM" },
];

const FIELDS = [
  { key: "what", label: "What it is" },
  { key: "useWhen", label: "Use when" },
  { key: "ciam", label: "CIAM relevance" },
];

export default function Compare({ story }) {
  const [audience, setAudience] = useState("all");
  const [field, setField] = useState("what");
  const sections = story.sections;
  const shown = useMemo(() => sections, [sections]);
  return (
    <section data-testid="tab-compare">
      <div className="panel">
        <h2>Compare the five sections</h2>
        <p className="muted">
          One row per console section. Pick the audience to keep only what that conversation needs — the guide's own split:
          workforce is the core story for every section; CIAM only touches the registry and the apps the customer-facing assistant calls.
        </p>
        <p className="actions" role="group" aria-label="Audience">
          {AUDIENCES.map((a) => (
            <button key={a.id} type="button" className={audience === a.id ? "primary" : ""} aria-pressed={audience === a.id} data-testid={`compare-aud-${a.id}`} onClick={() => setAudience(a.id)}>{a.label}</button>
          ))}
        </p>
        {audience !== "all" && <p className="intro">{story.pitches.find((p) => p.audience.toLowerCase() === audience)?.line}</p>}
      </div>
      <div className="compare-grid" data-testid="compare-grid">
        {shown.map((s) => {
          const ciamOnly = audience === "ciam" && s.ciam.toLowerCase().startsWith("not applicable");
          if (ciamOnly) {
            return (
              <div key={s.id} className="card compare-card compare-card--na" data-testid={`compare-${s.id}`}>
                <h3><span className="step-num" aria-hidden="true">{s.n}</span>{s.name}</h3>
                <p className="tag tag--warn">Not applicable in CIAM</p>
                <p className="muted">{s.ciam}</p>
              </div>
            );
          }
          return (
            <div key={s.id} className="card compare-card" data-testid={`compare-${s.id}`}>
              <h3><span className="step-num" aria-hidden="true">{s.n}</span>{s.name}</h3>
              <p className="muted">{s.tagline}</p>
              {audience !== "ciam" && <p>{s.workforce}</p>}
              {audience === "all" && <p><strong>Use when.</strong> {s.useWhen}</p>}
              <p><strong>{audience === "ciam" ? "What it is." : "CIAM."}</strong> {s.ciam}</p>
              {audience === "ciam" && s.workforceWeight === "core" && s.ciam && !s.ciam.toLowerCase().startsWith("rare") && !s.ciam.toLowerCase().startsWith("not") && (
                <p className="muted">Governance stays enterprise-shaped.</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="panel">
        <h2>The one-line pitch per audience</h2>
        <ul className="facts">
          {story.pitches.map((p) => <li key={p.audience}><strong>{p.audience}:</strong> {p.line}</li>)}
        </ul>
      </div>
    </section>
  );
}
