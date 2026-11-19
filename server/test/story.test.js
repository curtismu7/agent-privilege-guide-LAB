import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStory, FACTS, TALK_TRACK, SECTIONS } from '../src/story.js';
import { DIAGRAM_NAMES } from '../src/diagramData.js';
import { scanHosts } from '../src/safety.js';

const story = buildStory();

test('every section has the guide fields and names a diagram that exists', () => {
  assert.equal(SECTIONS.length, 5);
  for (const s of SECTIONS) {
    for (const k of ['id', 'n', 'name', 'what', 'useWhen', 'workforce', 'diagram']) assert.ok(s[k], `${s.id}: ${k}`);
    assert.deepEqual(s.can?.filter((x) => typeof x !== 'string'), [], `${s.id}: can is a list of strings`);
    assert.ok(DIAGRAM_NAMES.includes(s.diagram), `${s.id}: diagram ${s.diagram} exists in DIAGRAM_NAMES`);
  }
});

test('the mental model names its diagram; every diagram name is used', () => {
  assert.ok(DIAGRAM_NAMES.includes(story.mentalModel.diagram));
  const wanted = [...SECTIONS.map((s) => s.diagram), story.mentalModel.diagram];
  assert.deepEqual([...wanted].sort(), [...DIAGRAM_NAMES].sort(), 'all six diagrams are wanted exactly once');
});

test('every fact carries a status label: measured, inferred or UNVERIFIED', () => {
  assert.ok(FACTS.length >= 5);
  for (const f of FACTS) {
    assert.ok(f.id && f.text, f.id);
    assert.ok(['measured', 'inferred', 'UNVERIFIED'].includes(f.status), f.id);
  }
  assert.ok(FACTS.some((f) => f.status === 'measured'), 'the guide claims at least one measured fact');
  assert.ok(FACTS.some((f) => f.status === 'UNVERIFIED'), 'untested product behaviours are labelled UNVERIFIED');
});

test('the talk track is non-empty and each step says something', () => {
  assert.ok(TALK_TRACK.length >= 5);
  for (const t of TALK_TRACK) assert.ok(t.title && t.say && t.say.length > 10, t.title);
});

test('the banner and intro say what is simulated', () => {
  assert.match(story.banner, /SIMULATION/);
  assert.match(story.banner, /no outbound network/i);
  assert.match(story.realBanner, /REAL MODE/);
  assert.match(story.intro, /five sections/i);
});

test('no non-reserved hosts anywhere in the full story JSON', () => {
  assert.deepEqual(scanHosts(JSON.stringify(story)), [], 'every host in the story is .invalid, .example or loopback');
});
