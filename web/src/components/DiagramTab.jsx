import { useEffect, useState } from "react";
import PatternDiagram from "./PatternDiagram";
import { getJson } from "../api";

// The Diagrams tab: a picker over the six apg-* diagrams, each loaded by name from the server.
export default function DiagramTab({ names, resetSignal }) {
  const [name, setName] = useState(names[0]);
  return (
    <>
      <p className="actions" role="tablist" aria-label="Diagrams">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={name === n}
            data-testid={`diagram-pick-${n}`}
            onClick={() => setName(n)}
          >
            {n.replace(/^apg-/, "")}
          </button>
        ))}
      </p>
      <DiagramByName name={name} resetSignal={resetSignal} />
    </>
  );
}

export function DiagramByName({ name, resetSignal }) {
  const [pattern, setPattern] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { setPattern(null); setError(null); getJson(`/api/diagram?name=${encodeURIComponent(name)}`).then(setPattern, (e) => setError(e.message)); }, [name]);
  if (error) return <p className="field-error" role="alert">Could not load the diagram ({error}).</p>;
  if (!pattern) return <p className="muted">Loading...</p>;
  return <PatternDiagram key={name} pattern={pattern} resetSignal={resetSignal} />;
}
