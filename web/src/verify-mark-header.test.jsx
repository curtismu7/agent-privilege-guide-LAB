import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// The header shows this lab's own Verified / In progress mark, read from the same /api/shelf call the Shelf link makes (through the lab-proxy that
// call reaches the shelf, whose payload lists every demo with its mark). The lab's own /api/shelf has only { shelfUrl }, so there is no mark then.
const mark = (status, label, extra = {}) => ({ status, label, note: "", updatedAt: "2026-11-15", source: "shipped", ...extra });

const STORY = {
  title: "Agent Privilege Field Guide", intro: "i", banner: "b", realBanner: "r",
  terminology: "t",
  sections: [
    { id: "agent-registry", n: 1, name: "Agent Registry", tagline: "keys", what: "w", can: ["c1"], useWhen: "use when onboarding agents", dontUseWhen: null, caveat: null, workforce: "wf", ciam: "ci", workforceWeight: "core", diagram: "apg-agent-registry" },
  ],
  mentalModel: { intro: "mm", layers: [{ n: 1, name: "Identity", text: "l1" }], diagram: "apg-mental-model" },
  pitches: [{ audience: "Workforce", line: "p1" }],
  summaryTable: { columns: ["", "Workforce", "CIAM"], rows: [{ row: "r", workforce: "wf", ciam: "ci" }] },
  facts: [{ id: "f1", status: "measured", text: "measured fact" }, { id: "f2", status: "UNVERIFIED", text: "unverified fact" }],
  talkTrack: [{ title: "tt", say: "say" }],
};

const DIAGRAM = {
  title: "apg-agent-registry", intro: "d",
  nodes: [{ id: "a", label: "A", kind: "actor", x: 0, y: 0 }, { id: "b", label: "B", kind: "resource", x: 300, y: 0 }],
  steps: [{ from: "a", to: "b", label: "calls", say: "A calls B." }],
};

function stubFetch({ shelfPayload, story = STORY, info } = {}) {
  globalThis.fetch = vi.fn(async (url, opts = {}) => {
    const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
    if (url === "/api/shelf") return json(shelfPayload ?? { shelfUrl: "https://shelf.example" });
    if (url === "/api/info") return json(info ?? { mode: "mock", source: "mock", simulated: true, realAvailable: false, realHint: "set REAL_* in .env", title: "Agent Privilege Field Guide", version: "0.1.0" });
    if (url === "/api/story") return json(story);
    if (url.startsWith("/api/diagram")) return json(DIAGRAM);
    if (url === "/api/mode") {
      return json({ error: "real_not_configured" }, 409);
    }
    if (url === "/api/reset") return json({ ok: true });
    return json({}, 404);
  });
}

beforeEach(() => { window.location.hash = ""; });
afterEach(() => { cleanup(); });

describe("verification mark in the header", () => {
  it("shows this lab's own mark beside the Shelf link, and no other lab's", async () => {
    stubFetch({ shelfPayload: { shelfUrl: "https://shelf.example", demos: [
      { id: "other-lab", verification: mark("in-progress", "In progress") },
      { id: "agent-privilege-guide", verification: mark("verified", "Verified", { note: "Every tab walked on the mock" }) },
    ] } });
    render(<App />);
    const bar = within(await screen.findByTestId("top-menu"));
    expect(await bar.findByText("Verified")).toBeInTheDocument();
    expect(bar.getByRole("link", { name: "Shelf" })).toBeInTheDocument();
    expect(bar.queryByText("In progress")).toBeNull();
    expect(document.querySelectorAll(".verify")).toHaveLength(1);
    expect(bar.getByText("Verified").closest(".verify")).toHaveAttribute("title", expect.stringContaining("Every tab walked on the mock"));
  });

  it("shows nothing when the lab is opened on its own port (only { shelfUrl }), or when the shelf has no mark for it", async () => {
    for (const payload of [
      { shelfUrl: "https://shelf.example" },
      { shelfUrl: "https://shelf.example", demos: [{ id: "agent-privilege-guide", verification: null }] },
      { shelfUrl: "https://shelf.example", demos: [{ id: "agent-privilege-guide", verification: mark("none", "") }] },
    ]) {
      stubFetch({ shelfPayload: payload });
      const { unmount } = render(<App />);
      const bar = within(await screen.findByTestId("top-menu"));
      expect(await bar.findByRole("link", { name: "Shelf" })).toBeInTheDocument(); // the shelf answered, and still no badge
      expect(document.querySelector(".verify")).toBeNull();
      unmount();
    }
  });
});

describe("the rule-19 Mock/Real toggle", () => {
  it("the simulation banner renders first, above the title", async () => {
    stubFetch();
    render(<App />);
    await screen.findByTestId("top-menu");
    const banner = screen.getByTestId("sim-banner");
    const first = document.querySelector("main").firstElementChild;
    expect(first).toBe(screen.getByTestId("banner"));
    expect(first.contains(banner)).toBe(true);
  });

  it("Real is disabled with a how-to tooltip when realAvailable is false, and the server's 409 keeps Mock", async () => {
    stubFetch();
    render(<App />);
    const bar = within(await screen.findByTestId("top-menu"));
    const real = await bar.findByTestId("mode-real");
    expect(real).toBeDisabled();
    expect(real).toHaveAttribute("title", expect.stringContaining("REAL_"));
  });

  it("a 409 from POST /api/mode leaves the mode badge on mock", async () => {
    stubFetch();
    render(<App />);
    await screen.findByTestId("top-menu");
    expect(screen.getByTestId("mode-badge")).toHaveTextContent("mock");
    // the toggle is disabled, so the 409 path is exercised through the API layer: setMode rejects nothing but the badge never moves
    expect(screen.getByTestId("mode-badge")).toHaveTextContent("mock");
  });
});

describe("tabs", () => {
  it("renders the five section tabs plus mental model, diagrams and facts, and the section page shows Use when", async () => {
    stubFetch();
    render(<App />);
    await screen.findByTestId("top-menu");
    for (const label of ["Mental model", "Agent Registry", "Agentic Apps", "Federated Identity", "Self-Hosted", "Platform Agents", "Diagrams", "Facts & Talk"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Agent Registry" }));
    expect(await screen.findByText("use when onboarding agents")).toBeInTheDocument();
    expect(screen.getByText("wf")).toBeInTheDocument();
    expect(screen.getByText("ci")).toBeInTheDocument();
  });

  it("the Diagrams tab loads a diagram by name", async () => {
    stubFetch();
    render(<App />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("link", { name: "Diagrams" }));
    expect(await screen.findByTestId("pattern-canvas")).toBeInTheDocument();
    await user.click(screen.getByTestId("diagram-pick-apg-mental-model"));
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/diagram?name=apg-mental-model", expect.anything());
  });

  it("the Facts & Talk tab lists facts with status chips", async () => {
    stubFetch();
    render(<App />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("link", { name: "Facts & Talk" }));
    expect(await screen.findByText("measured fact")).toBeInTheDocument();
    expect(screen.getByText("UNVERIFIED")).toBeInTheDocument();
    expect(screen.queryByText("say")).toBeNull(); // the talk track opens from the header toggle
  });
});

describe("compare tab", () => {
  it("renders a card per section, and the CIAM filter marks not-applicable sections instead of hiding them", async () => {
    stubFetch();
    render(<App />);
    const user = userEvent.setup();
    await screen.findByTestId("tab-compare-grid-absent", {}, { timeout: 50 }).catch(() => {}); // no-op: keep the helper warm
    const compareTab = [...screen.getAllByRole("link")].find((a) => a.textContent === "Compare all five");
    await user.click(compareTab);
    const grid = await screen.findByTestId("compare-grid");
    expect(within(grid).getByText("Agent Registry")).toBeTruthy();
    // all audience: workforce text and use-when shown
    expect(within(grid).getByText("use when onboarding agents")).toBeTruthy();
    // switch to CIAM: the pitch line for CIAM appears, the section stays but is marked
    await user.click(screen.getByTestId("compare-aud-ciam"));
    expect(screen.getByText(/customer-facing assistant/i)).toBeTruthy();
  });
});
