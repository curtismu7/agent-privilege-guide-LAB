import React, { useCallback, useEffect, useState } from "react";
import TopMenu from "./top-menu/TopMenu.jsx";
import Banner from "./components/Banner.jsx";
import DiagramTab from "./components/DiagramTab.jsx";
import TalkTrack from "./components/TalkTrack.jsx";
import Compare from "./components/Compare.jsx";
import ShelfLink from "./components/ShelfLink.jsx";
import ReleaseNotes from "./components/ReleaseNotes.jsx";
import VerifyMark from "./components/VerifyMark.jsx";
import PatternDiagram from "./components/PatternDiagram.jsx";
import { getJson, setMode } from "./api";
import { workspaceId } from "./workspace";

const TABS = [
  { id: "mental-model", label: "Mental model" },
  { id: "compare", label: "Compare all five" },
  { id: "agent-registry", label: "Agent Registry" },
  { id: "agentic-apps", label: "Agentic Apps" },
  { id: "federated-identity", label: "Federated Identity" },
  { id: "self-hosted-agents", label: "Self-Hosted" },
  { id: "ai-platform-agents", label: "Platform Agents" },
  { id: "diagram", label: "Diagrams" },
  { id: "facts", label: "Facts & Talk" },
];

const DIAGRAM_NAMES = [
  "apg-mental-model",
  "apg-agent-registry",
  "apg-agentic-apps",
  "apg-federated-identity",
  "apg-self-hosted",
  "apg-ai-platform-agents",
];

export default function App() {
  const [tab, setTab] = useState("mental-model");
  const [story, setStory] = useState(null);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [present, setPresent] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [theme, setTheme] = useState(() => (localStorage.getItem("theme") || "auto"));

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "auto" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadAll = useCallback(async () => {
    try {
      const [s, i] = await Promise.all([
        fetch("/api/story").then((r) => r.json()),
        fetch("/api/info").then((r) => r.json()),
      ]);
      setStory(s); setInfo(i);
      setError(null);
    } catch (e) {
      setError(String(e.message || e));
    }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const reset = async () => {
    await fetch("/api/reset", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    setResetSignal((n) => n + 1);
    await loadAll();
  };

  const changeMode = async (source) => {
    const r = await fetch("/api/mode", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source }) });
    if (r.ok) setInfo((i) => ({ ...i, mode: source, source }));
    return r.ok;
  };

  if (error && !story) return <p className="app-error">The lab could not start: {error}</p>;
  if (!story) return <p className="muted">Loading…</p>;

  const section = story.sections.find((s) => s.id === tab);

  return (
    <div className={present ? "app app--presenter" : "app"}>
      <header className="shell-bar">
        <span className="shell-brand">
          <span className="shell-logo">AI</span>
          Agent Privilege Field Guide
          <span className={`shell-badge ${info?.mode === "real" ? "shell-badge--real" : ""}`} data-testid="mode-badge">{info?.mode ?? "…"}</span>
        </span>
        <nav className="shell-nav" aria-label="Tabs">
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} aria-current={tab === t.id ? "page" : undefined} onClick={(e) => { e.preventDefault(); setTab(t.id); }}>{t.label}</a>
          ))}
        </nav>
        <TopMenu
          mode={{ value: info?.mode ?? "mock", onChange: changeMode, realAvailable: info?.realAvailable, realHint: info?.realHint }}
          theme={{ value: theme, onChange: setTheme }}
          present={{ active: present, onToggle: () => setPresent((p) => !p) }}
          talkTrack={{ active: talkOpen, onToggle: () => setTalkOpen((t) => !t) }}
          onReset={reset}
          version={info?.version ? `v${info.version}` : undefined}
          onVersion={() => setNotesOpen(true)}
        >
          <ShelfLink />
          <VerifyMark id="agent-privilege-guide" />
        </TopMenu>
        {notesOpen && <ReleaseNotes version={info?.version ? `v${info.version}` : ""} onClose={() => setNotesOpen(false)} />}
      </header>
      <main className="page">
        <Banner story={story} mode={info?.mode} />
        <p className="keys">Workspace {workspaceId()} · everything simulated · no tenant, no outbound network</p>
        {tab === "mental-model" && <MentalModel story={story} resetSignal={resetSignal} />}
        {tab === "compare" && <Compare story={story} />}
        {section && <SectionPage section={section} resetSignal={resetSignal} />}
        {tab === "diagram" && <section data-testid="tab-diagram"><DiagramTab names={DIAGRAM_NAMES} resetSignal={resetSignal} /></section>}
        {tab === "facts" && (
          <section data-testid="tab-facts">
            <div className="panel">
              <h2>Facts — what is measured, what is not</h2>
              <ul className="facts">
                {story.facts.map((f) => (
                  <li key={f.id}>
                    <span className={`tag ${f.status === "measured" ? "tag--ok" : f.status === "UNVERIFIED" ? "tag--warn" : ""}`}>{f.status}</span> {f.text}
                  </li>
                ))}
              </ul>
            </div>
            {talkOpen && <div className="panel"><h2>Talk track</h2><TalkTrack talk={story.talkTrack.map((t, i) => ({ ...t, id: i }))} /></div>}
          </section>
        )}
        {talkOpen && tab !== "facts" && (
          <div className="panel"><h2>Talk track</h2><TalkTrack talk={story.talkTrack.map((t, i) => ({ ...t, id: i }))} /></div>
        )}
      </main>
    </div>
  );
}

function SectionDiagram({ name, resetSignal }) {
  const [pattern, setPattern] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { setPattern(null); setErr(null); getJson(`/api/diagram?name=${encodeURIComponent(name)}`).then(setPattern, (e) => setErr(e.message)); }, [name]);
  if (err) return <p className="field-error" role="alert">Could not load the diagram ({err}).</p>;
  if (!pattern) return <p className="muted">Loading diagram…</p>;
  return <PatternDiagram pattern={pattern} resetSignal={resetSignal} />;
}

function SectionPage({ section, resetSignal }) {
  return (
    <section data-testid={`tab-${section.id}`}>
      <div className="panel">
        <p className="section-label">Section {section.n} · {section.tagline}</p>
        <h1>{section.name}</h1>
        <p className="intro">{section.what}</p>
      </div>
      <div className="card-grid">
        <div className="card">
          <h3>What it can do</h3>
          <ul className="facts">
            {section.can.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3>Use when</h3>
          <p>{section.useWhen}</p>
          {(section.dontUseWhen || section.caveat) && (
            <>
              <h3>{section.dontUseWhen ? "Don't use when" : "Caveat"}</h3>
              <p>{section.dontUseWhen || section.caveat}</p>
            </>
          )}
        </div>
      </div>
      <div className="card-grid">
        <div className={`card${section.workforceWeight === "core" ? " card--ok" : ""}`}>
          <h3>Workforce</h3>
          <p>{section.workforce}</p>
        </div>
        <div className="card card--neutral">
          <h3>CIAM</h3>
          <p>{section.ciam}</p>
        </div>
      </div>
      {section.diagram && <SectionDiagram name={section.diagram} resetSignal={resetSignal} />}
    </section>
  );
}

function MentalModel({ story, resetSignal }) {
  const mm = story.mentalModel;
  return (
    <section data-testid="tab-mental-model">
      <div className="panel">
        <h1>Mental model</h1>
        <p className="intro">{mm.intro}</p>
      </div>
      <div className="card-grid">
        {mm.layers.map((l) => (
          <div className="card" key={l.n}>
            <h3>{l.n}. {l.name}</h3>
            <p>{l.text}</p>
          </div>
        ))}
      </div>
      <SectionDiagram name={mm.diagram} resetSignal={resetSignal} />
      <div className="panel">
        <h2>Terminology</h2>
        <p>{story.terminology}</p>
      </div>
      <div className="panel">
        <h2>Workforce vs CIAM</h2>
        <table>
          <thead>
            <tr>{story.summaryTable.columns.map((c, i) => <th key={i}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {story.summaryTable.rows.map((r) => (
              <tr key={r.row}>
                <th scope="row">{r.row}</th>
                <td>{r.workforce}</td>
                <td>{r.ciam}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-grid">
        {story.pitches.map((p) => (
          <div className="card card--neutral" key={p.audience}>
            <h3>{p.audience}</h3>
            <p>{p.line}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
