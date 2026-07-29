/* suggest-skills.mjs — recommend which installed skills fit a brief.
 *
 * The problem this solves: ~130 installed skills put ~10k tokens of descriptions into
 * every context window. Setting the pool to "name-only" in skillOverrides removes that
 * cost but also removes the only clue about what each skill does. This script is the
 * replacement index — it reads the descriptions from disk, on demand, at zero standing
 * cost, and prints the exact invocation.
 *
 *   node scripts/suggest-skills.mjs "dark editorial landing with heavy scroll motion"
 *   node scripts/suggest-skills.mjs --stage S1 "fintech dashboard"
 *   node scripts/suggest-skills.mjs --stage S1 --n 8 "warm print-adjacent brand"
 *   node scripts/suggest-skills.mjs --list-stages
 *
 * Scoring is IDF-weighted term overlap on stemmed words, with a bias from --stage.
 * It narrows the field; it does not choose. Picking the author for a direction is a
 * judgement call and stays with whoever is running the stage.
 *
 * Known limit, left in rather than papered over: it cannot resolve polysemy. A brief
 * about dropped *frames* ranks `nested-container-frames` above the performance skill,
 * because one is named for the word and the other merely uses it. No lexical method
 * fixes that. Read the shortlist rather than taking the top hit.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const argv = process.argv.slice(2);
const flag = (name, def = null) => {
  const i = argv.indexOf(name);
  return i === -1 ? def : argv[i + 1];
};
const STAGE = (flag('--stage') || '').toUpperCase();
const N = Number(flag('--n', 10));
const LIST_STAGES = argv.includes('--list-stages');
const brief = argv.filter((a, i) =>
  !a.startsWith('--') && argv[i - 1] !== '--stage' && argv[i - 1] !== '--n').join(' ');

/* Stage hints. Deliberately coarse: they bias the ranking, they do not gate it, because
   a skill filed under one stage is often the right answer at another. */
const STAGE_HINTS = {
  S0: ['research', 'genre', 'preset', 'pattern', 'inspiration', 'capture', 'reference'],
  S1: ['design system', 'layout', 'editorial', 'landing', 'visual', 'style', 'mood',
       'identity', 'hero', 'brand', 'palette', 'typography', 'imagegen', 'prototype'],
  S2: ['audit', 'critique', 'review', 'grill', 'compare'],
  S3: ['token', 'scale', 'palette', 'chart', 'dataviz', 'color'],
  S4: ['component', 'motion', 'animation', 'interaction', 'accessibility', 'library',
       'implement', 'build', 'performance'],
  S5: ['refine', 'audit', 'polish', 'improve', 'review', 'redesign', 'optimize', 'test',
       'performance', 'profile', 'regression', 'accessibility'],
};

if (LIST_STAGES) {
  for (const [s, hints] of Object.entries(STAGE_HINTS)) console.log(`${s}  ${hints.join(', ')}`);
  process.exit(0);
}
if (!brief) {
  console.error('usage: node scripts/suggest-skills.mjs [--stage S1] [--n 10] "<brief>"');
  process.exit(2);
}

/* Every place an agent CLI keeps skills. Duplicates collapse by name. */
const ROOTS = [
  join(homedir(), '.agents', 'skills'),
  join(homedir(), '.claude', 'skills'),
  join(homedir(), '.codex', 'skills'),
  join(process.cwd(), '.claude', 'skills'),
];

const skills = new Map();
for (const root of ROOTS) {
  if (!existsSync(root)) continue;
  for (const dir of readdirSync(root)) {
    if (skills.has(dir)) continue;
    const file = join(root, dir, 'SKILL.md');
    if (!existsSync(file) || !statSync(file).isFile()) continue;
    const head = readFileSync(file, 'utf8').slice(0, 6000);
    const m = /^description:\s*(.+?)(?=\n[a-z-]+:\s|\n---)/ms.exec(head);
    const desc = (m ? m[1] : '').replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();
    skills.set(dir, desc);
  }
}

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'with', 'use', 'when', 'that',
  'this', 'into', 'from', 'your', 'you', 'it', 'is', 'are', 'to', 'of', 'in', 'on', 'by',
  'as', 'at', 'be', 'not', 'but', 'more', 'than', 'has', 'have', 'can', 'its', 'their']);
/* Light stemming, and word-level rather than substring matching. Both matter: a brief
   about dropped "frames" must reach a description that says "frame-time drops", and
   must NOT reach "nested-container-frames" just because the letters appear. Substring
   matching got that exactly backwards on the first run. */
const stem = w => (w.length > 3 ? w.replace(/ies$/, 'y').replace(/(es|s)$/, '') : w);
const terms = s => (s.toLowerCase().match(/[a-z0-9가-힣]{2,}/g) ?? [])
  .filter(t => !STOP.has(t)).map(stem);

const briefTerms = terms(brief);
const hintTerms = STAGE ? terms((STAGE_HINTS[STAGE] || []).join(' ')) : [];

/* Rare terms decide, common ones barely move the needle. Without this, a brief about
   dropped FRAMES on mobile ranked `nested-container-frames` above the performance
   skill: "frames" and "mobile" are everywhere in a design-skill corpus, so a literal
   match on them means almost nothing. Straight IDF, no smoothing beyond the +1. */
const indexed = [...skills].map(([name, desc]) => ({
  name, desc,
  nameSet: new Set(terms(name.replace(/-/g, ' '))),
  allSet: new Set(terms(`${name.replace(/-/g, ' ')} ${desc}`)),
}));

const idf = t => Math.log(1 + indexed.length / (1 + indexed.filter(s => s.allSet.has(t)).length));
const weights = new Map(briefTerms.map(t => [t, idf(t)]));

const scored = indexed.map(({ name, desc, nameSet, allSet }) => {
  let score = 0;
  for (const t of briefTerms) {
    const w = weights.get(t);
    if (nameSet.has(t)) score += 2.5 * w;   // named for it, still IDF-scaled
    else if (allSet.has(t)) score += w;
  }
  for (const t of hintTerms) if (allSet.has(t)) score += 0.5;   // the stage is real signal the caller gave
  return { name, desc, score };
}).filter(s => s.score > 0).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

if (!scored.length) {
  console.log(`no match for "${brief}" among ${skills.size} installed skills.`);
  console.log('Try fewer or more common words, or drop --stage.');
  process.exit(0);
}

const top = scored.slice(0, N);
console.log(`\n${top.length} of ${scored.length} matches` +
  (STAGE ? ` (biased toward ${STAGE})` : '') + `, from ${skills.size} installed:\n`);
for (const { name, desc, score } of top) {
  console.log(`  ${String(score.toFixed(1)).padStart(5)}  ${name}`);
  if (desc) console.log(`         ${desc.slice(0, 150)}${desc.length > 150 ? '…' : ''}`);
}
console.log('\nInvoke one by name. If a skill is set to "name-only" its description is');
console.log('absent from context — that is what this script replaces, not a lock.');
if (STAGE === 'S1') {
  console.log('\nS1 reminder: one author per direction, and pick authors that genuinely');
  console.log('disagree. Two picks from the same family produce one idea twice.');
}
