// Writes docs/talk-track.md from the talk-track data (so the doc and the web talk-track view cannot drift).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildStory } from '../server/src/story.js';

const story = buildStory();
const lines = [
  '# Talk track',
  '',
  '<!-- Generated from server/src/story.js by `npm run talk-track`. Do not edit by hand. -->',
  '',
  '## What this page is',
  '',
  story.intro,
  '',
  `## Terminology`,
  '',
  story.terminology,
  '',
  '## The beats',
  '',
  ...story.talkTrack.map((t, i) => `${i + 1}. **${t.title}.** ${t.say}`),
  '',
  '## What to leave with',
  '',
  ...story.pitches.map((p) => `- **${p.audience}:** ${p.line}`),
  '',
];
fs.writeFileSync(fileURLToPath(new URL('../docs/talk-track.md', import.meta.url)), `${lines.join('\n')}\n`);
console.log('wrote docs/talk-track.md');
