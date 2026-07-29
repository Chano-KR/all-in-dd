/* check-skills.mjs — report which workflow skills are installed and print the
   exact install line for the ones that are not. See SKILLS.md for what each does.
   Looks in every location an agent CLI reads: the shared ~/.agents/skills pool,
   per-CLI homes, and a project-local .claude/skills.
     node scripts/check-skills.mjs            report
     node scripts/check-skills.mjs --strict   exit 1 if anything REQUIRED is missing  */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const STRICT = process.argv.includes('--strict');
const home = homedir();

const ROOTS = [
  join(home, '.agents', 'skills'),
  join(home, '.claude', 'skills'),
  join(home, '.codex', 'skills'),
  join(home, '.config', 'agents', 'skills'),
  join(process.cwd(), '.claude', 'skills'),
];

const SKILLS = [
  // stage, name, required, source
  ['S0', 'ui-ux-pro-max',               false, 'nextlevelbuilder/ui-ux-pro-max-skill'],
  ['S1', 'high-end-visual-design',      true,  'Leonxlnx/taste-skill'],
  ['S1', 'gpt-taste',                   true,  'Leonxlnx/taste-skill'],
  ['S1', 'minimalist-ui',               true,  'Leonxlnx/taste-skill'],
  ['S1', 'industrial-brutalist-ui',     true,  'Leonxlnx/taste-skill'],
  ['S1', 'design-taste-frontend',       true,  'Leonxlnx/taste-skill'],
  ['S1', 'imagegen-frontend-web',       true,  'Leonxlnx/taste-skill'],
  ['S1', 'image-to-code',               true,  'Leonxlnx/taste-skill'],
  ['S2', 'impeccable',                  true,  'https://github.com/pbakaus/impeccable --skill impeccable'],
  ['S4', 'apple-design',                true,  'emilkowalski/skills'],
  ['S4', 'emil-design-eng',             true,  'emilkowalski/skills'],
  ['S5', 'find-animation-opportunities',true,  'emilkowalski/skills'],
  ['S5', 'improve-animations',          true,  'emilkowalski/skills'],

  ['S1', 'brandkit',                    false, 'Leonxlnx/taste-skill'],
  ['S1', 'imagegen-frontend-mobile',    false, 'Leonxlnx/taste-skill'],
  ['S1', 'prototype',                   false, 'mattpocock/skills'],
  ['S2', 'grill-me',                    false, 'mattpocock/skills'],
  ['S4', 'pick-ui-library',             false, 'emilkowalski/skills'],
  ['S5', 'review-animations',           false, 'emilkowalski/skills'],
  ['S5', 'redesign-existing-projects',  false, 'Leonxlnx/taste-skill'],
  ['S5', 'animation-vocabulary',        false, 'emilkowalski/skills'],
  ['S4', 'remotion-best-practices',     false, 'remotion-dev/skills'],

  /* The author and technique pools are deliberately NOT enumerated here. They are
     open-ended (about seventy skills and growing), and a checklist that long stops
     being read. SKILLS.md lists them; this file checks the ones a stage cannot run
     without. What it does check is that the pool is not empty. */
];

const POOL_MARKERS = ['editorial-tech', 'glass-dark-ui', 'animation-systems', 'beautiful-shadows'];

const present = new Set();
for (const root of ROOTS) {
  if (!existsSync(root)) continue;
  for (const entry of readdirSync(root)) present.add(entry);
}

const pad = s => s.padEnd(30);
const missing = [];

for (const tier of [true, false]) {
  const rows = SKILLS.filter(s => s[2] === tier);
  console.log(`\n${tier ? 'REQUIRED' : 'RECOMMENDED'}`);
  for (const [stage, name, , source] of rows) {
    const ok = present.has(name);
    if (!ok) missing.push([name, source, tier]);
    console.log(`  ${ok ? '✓' : '✗'} ${stage}  ${pad(name)}${ok ? '' : source}`);
  }
}

const poolFound = POOL_MARKERS.filter(n => present.has(n)).length;
console.log(`\nAuthor/technique pool: ${poolFound}/${POOL_MARKERS.length} probes present` +
  (poolFound ? '' : ' — see SKILLS.md; a thin author pool caps how far S1 can diverge'));
console.log('Charts: dataviz ships with Claude Code — nothing to install');
console.log('Canvas: pen.dev, a separate MCP tool (ENGINE §2.4)');

if (missing.length) {
  const sources = [...new Set(missing.map(m => m[1]))];
  console.log('\nInstall the missing ones:\n');
  for (const s of sources) console.log(`  npx skills add ${s}`);
  const reqMissing = missing.filter(m => m[2]);
  if (reqMissing.length) {
    console.log(`\n${reqMissing.length} REQUIRED skill(s) missing. At S1 this matters most:`);
    console.log('a thinner set of authors makes the directions converge — four variations');
    console.log('of one idea instead of four ideas.');
    if (STRICT) process.exit(1);
  }
} else {
  console.log('\nAll listed skills present.');
}
