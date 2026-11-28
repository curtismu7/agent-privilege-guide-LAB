import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App, { MODE_LINES } from "./App";

// The Real-or-mock modal's wiring (the component's own behaviour is tested in the shared mode-modal folder).
const STORY = {
  title: "Agent Privilege Field Guide", intro: "intro text", banner: "b", realBanner: "r", terminology: "t",
  sections: [{ id: "agent-registry", n: 1, name: "Agent Registry", tagline: "keys", what: "w", can: ["c1"], useWhen: "u", dontUseWhen: null, caveat: null, workforce: "wf", ciam: "ci", workforceWeight: "core", diagram: "apg-agent-registry" }],
  mentalModel: { intro: "mm", layers: [{ n: 1, name: "Identity", text: "l1" }], diagram: "apg-mental-model" },
  pitches: [{ audience: "Workforce", line: "p1" }],
  summaryTable: { columns: ["", "Workforce", "CIAM"], rows: [{ row: "r", workforce: "wf", ciam: "ci" }] },
  facts: [{ id: "f1", status: "measured", text: "measured fact" }],
  talkTrack: [{ title: "tt", say: "say" }],
};
const DIAGRAM = { title: "d", intro: "d", nodes: [{ id: "a", label: "A", kind: "actor", x: 0, y: 0 }], steps: [] };
const INFO = { mode: "mock", source: "mock", simulated: true, realAvailable: false, realHint: "set REAL_* in .env", version: "0.1.0" };

function stubFetch(info = INFO) {
  globalThis.fetch = vi.fn(async (url) => {
    const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
    if (url === "/api/info") return json(info);
    if (url === "/api/story") return json(STORY);
    if (url.startsWith("/api/diagram")) return json(DIAGRAM);
    if (url === "/api/mode") return json({ source: "real" });
    if (url === "/api/reset") return json({ ok: true });
    return json({}, 404);
  });
}

beforeEach(() => { window.location.hash = ""; sessionStorage.clear(); });
afterEach(() => { cleanup(); sessionStorage.clear(); });

describe("the Real-or-mock modal", () => {
  it("opens on MOCK with the simulation line (guided tour, UNVERIFIED label, no tenant), and there is no banner", async () => {
    stubFetch();
    render(<App />);
    const modal = await screen.findByTestId("mode-modal");
    expect(modal).toHaveAttribute("data-mode", "mock");
    expect(modal).toHaveTextContent(/^MOCK/);
    expect(modal).toHaveTextContent(/not a console/);
    expect(modal).toHaveTextContent(/labelled UNVERIFIED/);
    expect(modal).toHaveTextContent(/no tenant, no outbound network and no credentials/);
    expect(screen.queryByTestId("sim-banner")).toBeNull();
    expect(screen.queryByTestId("real-banner")).toBeNull();
    expect(document.querySelector(".banner")).toBeNull();
    expect(screen.getByText("intro text")).toBeInTheDocument();
  });

  it("closes on Got it and stays away after a same-session remount", async () => {
    stubFetch();
    const { unmount } = render(<App />);
    fireEvent.click(await screen.findByTestId("mode-modal-ok"));
    expect(screen.queryByTestId("mode-modal")).toBeNull();
    unmount();
    render(<App />);
    await screen.findByText("intro text");
    expect(screen.queryByTestId("mode-modal")).toBeNull();
  });

  it("says REAL, and that the content is the same simulation, when the lab reports real", async () => {
    stubFetch({ ...INFO, mode: "real", source: "real", realAvailable: true });
    render(<App />);
    const modal = await screen.findByTestId("mode-modal");
    expect(modal).toHaveAttribute("data-mode", "real");
    expect(modal).toHaveTextContent(/^REAL/);
    expect(modal).toHaveTextContent(/no live engine/);
    expect(modal).toHaveTextContent(/same simulation/);
    expect(modal.textContent).toContain(MODE_LINES.real);
  });

  it("switching Mock to Real shows REAL even though MOCK was dismissed", async () => {
    stubFetch({ ...INFO, realAvailable: true });
    render(<App />);
    fireEvent.click(await screen.findByTestId("mode-modal-ok"));
    expect(screen.queryByTestId("mode-modal")).toBeNull();
    fireEvent.click(await screen.findByTestId("mode-real"));
    await waitFor(() => expect(screen.getByTestId("mode-modal")).toHaveAttribute("data-mode", "real"));
  });
});
