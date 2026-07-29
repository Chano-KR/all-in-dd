/* test-gates.mjs — poisoned fixtures for the gate scripts.
 *
 * Why this exists: six defects were found in one afternoon and four were the same
 * shape — a check that examined nothing and reported success. Absent scale, missing
 * ground, unimplemented bracket rule, zero-section ledger. The system's own doctrine
 * ("a gate that skips silently is worse than one that fails", "verify a new rule in
 * both directions") was stated in prose and enforced by hand, which is to say not
 * enforced. Every case below asserts BOTH directions: the clean input passes and the
 * poisoned input fails.
 *
 *   node scripts/test-gates.mjs          run all
 *   node scripts/test-gates.mjs --only drift
 *
 * Writes a throwaway brand under brands/__fixture__ and removes it afterwards.
 */

import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const BRAND = '__fixture__';
const brandDir = join(root, 'brands', BRAND);
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

let passed = 0;
const failures = [];

/* A minimal but VALID token set: two distinct radii, three spaces, two weights,
   text/surface roles that clear 4.5:1, and the three interaction states. Each case
   below poisons exactly one thing, so a failure names its own cause. */
const CLEAN = {
  'radius-small': '3px', 'radius-large': '10px',
  'space-2': '8px', 'space-4': '16px', 'space-6': '32px',
  'font-weight-body': '400', 'font-weight-strong': '600',
  'surface-page': '#FFFFFF', 'surface-line': '#E2E5E8',
  'text-primary': '#121921', 'text-secondary': '#5F6772',
  'action-base': '#BA4F1F', 'action-hover': '#CE683F',
  'action-press': '#973E16', 'action-focus-ring': '#CE683F',
};

const writeTokens = (map) => {
  mkdirSync(join(brandDir, 'dist'), { recursive: true });
  const body = Object.entries(map).map(([k, v]) => `  --ds-${k}: ${v};`).join('\n');
  writeFileSync(join(brandDir, 'dist', 'tokens.css'), `:root {\n${body}\n}\n`);
};
const writeDrift = (obj) => {
  if (obj === null) { rmSync(join(brandDir, 'drift.json'), { force: true }); return; }
  writeFileSync(join(brandDir, 'drift.json'), JSON.stringify(obj, null, 1));
};
const writeFile = (name, content) => {
  const p = join(brandDir, name);
  writeFileSync(p, content);
  return `brands/${BRAND}/${name}`;
};

const run = (script, args) => {
  const r = spawnSync(process.execPath, [join(root, 'scripts', script), ...args],
    { cwd: root, encoding: 'utf8' });
  return { code: r.status ?? 0, out: (r.stdout ?? '') + (r.stderr ?? '') };
};

/* expect: 'pass' means exit 0, 'fail' means non-zero. `because` must appear in output
   when failing, so a case cannot pass for the wrong reason. */
function check(name, { script, args, expect, because }) {
  const { code, out } = run(script, args);
  const ok = expect === 'pass' ? code === 0 : code !== 0;
  const reasonOk = !because || expect === 'pass' || out.toLowerCase().includes(because.toLowerCase());
  if (ok && reasonOk) { passed++; console.log(`  ok    ${name}`); return; }
  failures.push(name);
  console.log(`  FAIL  ${name}`);
  console.log(`        expected ${expect}, got exit ${code}${!reasonOk ? `; missing reason "${because}"` : ''}`);
  console.log(out.split('\n').filter(Boolean).slice(0, 4).map(l => `        | ${l}`).join('\n'));
}

const group = (n) => !only || only === n;

try {
  /* ---------------- gate 0b: token readiness ---------------- */
  if (group('drift')) {
    console.log('\ngate 0b — token readiness');

    writeTokens(CLEAN); writeDrift(null);
    check('clean token set passes', { script: 'check-drift.mjs', args: [BRAND], expect: 'pass' });

    /* The four silent-pass shapes. Each of these once reported success. */
    writeTokens(Object.fromEntries(Object.entries(CLEAN).filter(([k]) =>
      !/^(surface|text|action)/.test(k))));
    check('zero colours is a failure, not a vacuous pass',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'something to check' });

    writeTokens({ ...CLEAN, 'radius-large': '3px' });   // two names, one value
    check('duplicate scale values do not count as two steps',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'distinct' });

    writeTokens(Object.fromEntries(Object.entries(CLEAN).filter(([k]) => !k.startsWith('radius'))));
    check('an absent scale fails rather than being skipped',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'distinct' });

    const renamed = Object.fromEntries(Object.entries(CLEAN)
      .map(([k, v]) => [k === 'surface-page' ? 'surface-canvas' : k, v]));
    writeTokens(renamed);
    check('a text role with no ground fails instead of being dropped',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'ground' });

    writeTokens({ ...renamed });
    writeDrift({ contrast: [['text-primary', 'surface-canvas'], ['text-secondary', 'surface-canvas']] });
    check('a brand may declare its own contrast pairs',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'pass' });
    writeDrift(null);

    writeTokens({ ...CLEAN, 'text-secondary': '#B9BEC4' });   // ~2.3:1 on white
    check('a text role below 4.5:1 fails',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: '4.5' });

    writeTokens(Object.fromEntries(Object.entries(CLEAN).filter(([k]) => k !== 'action-hover')));
    check('a missing interaction state fails',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'hover, press and focus' });

    /* opt-in rules: absent file forbids nothing, declared file catches */
    writeTokens(CLEAN); writeDrift(null);
    check('no drift.json forbids nothing', { script: 'check-drift.mjs', args: [BRAND], expect: 'pass' });

    writeDrift({ forbid: [{ name: 'test region', L: [0.5, 0.7], C: [0.1, 0.2], H: [30, 60] }] });
    check('a declared forbidden region is enforced',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'test region' });

    writeDrift({ forbidNames: ['action'] });
    check('declared forbidden token names are enforced',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'action' });

    /* surface half — the part that stayed unrewritten for a full round */
    writeDrift({ forbidCss: [{ name: 'no box-shadow', pattern: 'box-shadow\\s*:(?!\\s*none)' }] });
    const shadowed = writeFile('probe.css', '.a { box-shadow: 0 2px 8px #0003; }');
    check('a declared surface CSS rule is enforced',
      { script: 'check-drift.mjs', args: [BRAND, shadowed], expect: 'fail', because: 'no box-shadow' });

    writeDrift(null);
    check('with nothing declared the same surface passes',
      { script: 'check-drift.mjs', args: [BRAND, shadowed], expect: 'pass' });

    writeDrift({ sectionMarker: 'data-blank' });
    const naked = writeFile('probe.html', '<section><p>a</p></section>');
    check('a section missing the declared marker fails',
      { script: 'check-drift.mjs', args: [BRAND, naked], expect: 'fail', because: 'data-blank' });

    const marked = writeFile('probe2.html', '<section data-blank="x"><p>a</p></section>');
    check('a section carrying the marker passes',
      { script: 'check-drift.mjs', args: [BRAND, marked], expect: 'pass' });
    writeDrift(null);
  }

  /* ---------------- gate 1: hardcodes ---------------- */
  if (group('tokens')) {
    console.log('\ngate 1 — hardcodes and unknown tokens');
    writeTokens(CLEAN);

    const good = writeFile('good.css', '.a { color: var(--ds-text-primary); padding: var(--ds-space-4); }');
    check('token-only CSS passes', { script: 'check-tokens.mjs', args: [BRAND, good], expect: 'pass' });

    for (const [label, css, because] of [
      ['a literal colour fails', '.a { color: #2563EB; }', 'literal colour'],
      ['a literal px fails', '.a { padding: 17px; }', 'literal px'],
      ['a literal rgb() fails', '.a { color: rgba(0,0,0,.4); }', 'literal rgb'],
      ['an undefined token fails', '.a { color: var(--ds-nope); }', 'undefined token'],
    ]) {
      const f = writeFile('bad.css', css);
      check(label, { script: 'check-tokens.mjs', args: [BRAND, f], expect: 'fail', because });
    }

    /* the rule ENGINE stated and the script did not implement */
    const arb = writeFile('arb.tsx',
      'const A = () => <div className="w-[35rem] text-[oklch(56%_0.15_42)] leading-[1.37]">x</div>;');
    check('Tailwind arbitrary values fail regardless of unit',
      { script: 'check-tokens.mjs', args: [BRAND, arb], expect: 'fail', because: 'arbitrary' });

    const utils = writeFile('utils.tsx',
      'const A = () => <div className="grid gap-6 md:flex-row">{arr[0]}</div>;');
    check('ordinary utilities and JS indexing are not flagged',
      { script: 'check-tokens.mjs', args: [BRAND, utils], expect: 'pass' });

    const html = writeFile('prose.html',
      '<p>order #0207, about 350px wide</p>\n<style>\n/* ~350px note */\n.a{color:var(--ds-text-primary)}\n</style>');
    check('HTML prose and comments are not scanned as CSS',
      { script: 'check-tokens.mjs', args: [BRAND, html], expect: 'pass' });

    const inline = writeFile('inline.html', '<div style="padding: 9px">x</div>');
    check('inline style attributes are scanned',
      { script: 'check-tokens.mjs', args: [BRAND, inline], expect: 'fail', because: 'literal px' });

    const mq = writeFile('mq.css', '@media (min-width: 880px) { .a { color: var(--ds-text-primary); } }');
    check('an undeclared breakpoint fails',
      { script: 'check-tokens.mjs', args: [BRAND, mq], expect: 'fail', because: 'breakpoint' });

    writeTokens({ ...CLEAN, 'web-breakpoint-compact': '880px' });
    check('a declared breakpoint is allowed',
      { script: 'check-tokens.mjs', args: [BRAND, mq], expect: 'pass' });

    check('an unknown brand exits cleanly, not with a stack trace',
      { script: 'check-tokens.mjs', args: ['nosuchbrand', mq], expect: 'fail', because: 'no built tokens' });
  }
} finally {
  if (existsSync(brandDir)) rmSync(brandDir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'));
  process.exit(1);
}
