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

import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
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

    /* A declaration must remap pairings, never narrow them: leaving the failing role
       out of the mapping used to hide it, since only declared inks were judged. */
    writeDrift({ contrast: [['text-primary', 'surface-page']] });
    check('a contrast mapping that omits a text role fails',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'cover every text role' });
    writeDrift(null);

    /* Equivalent spellings are one step, not two. */
    writeTokens({ ...CLEAN, 'radius-large': '3.0px' });
    check('3px and 3.0px count as one step',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'distinct' });

    writeTokens({ ...CLEAN, 'radius-small': '0px', 'radius-large': '0rem' });
    check('0px and 0rem count as one step',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'distinct' });

    /* A notation the gate cannot read used to remove the role from every colour rule,
       so it was neither judged nor reported. Unreadable is a failure to read. */
    writeTokens({ ...CLEAN, 'text-secondary': 'rgb(185 190 196)' });
    check('a text role in an unreadable notation fails',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'unreadable' });

    /* Exponent and single-term calc() are the same value spelled differently. */
    writeTokens({ ...CLEAN, 'radius-large': '3e0px' });
    check('3px and 3e0px count as one step',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'distinct' });

    writeTokens({ ...CLEAN, 'radius-large': 'calc(3px)' });
    check('3px and calc(3px) count as one step',
      { script: 'check-drift.mjs', args: [BRAND], expect: 'fail', because: 'distinct' });

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

    /* The rule ENGINE stated and the script did not implement. One form per fixture:
       bundling them let a single detection hide the other two failing. */
    for (const [label, code] of [
      ['a rem arbitrary value fails', 'className="w-[35rem]"'],
      ['a function arbitrary value fails', 'className="text-[oklch(56%_0.15_42)]"'],
      ['a unitless arbitrary value fails', 'className="leading-[1.37]"'],
      ['a NEGATIVE arbitrary value fails', 'className="-mt-[1rem]"'],
      ['a variant-prefixed negative fails', 'className="hover:-translate-x-[10%]"'],
      ['an arbitrary PROPERTY fails', 'className="[margin-top:1rem]"'],
      ['a variant-prefixed arbitrary property fails', 'className="hover:[mask-type:luminance]"'],
    ]) {
      const f = writeFile('arb.tsx', `const A = () => <div ${code}>x</div>;`);
      check(label, { script: 'check-tokens.mjs', args: [BRAND, f], expect: 'fail', because: 'arbitrary' });
    }

    const utils = writeFile('utils.tsx',
      'const A = () => <div className="grid gap-6 md:flex-row">{arr[0]}{o["k"]}</div>;');
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
  /* ---------------- skill catalog consistency ---------------- */
  /* ---------------- gate 2: accessibility ---------------- */
  if (group('a11y')) {
    console.log('\ngate 2 — accessibility');
    const fixtures = join(root, 'fixtures', 'a11y');

    let browserReady = false;
    try {
      const { chromium } = await import('playwright');
      browserReady = existsSync(chromium.executablePath());
    } catch { /* same handling as gates 3 and 4 */ }

    if (!browserReady) {
      console.log('  skip  gate 2 fixtures — no chromium binary; run `npm run preflight -- --fix`');
    } else {
      const args = f => [join(fixtures, f), '--medium', 'desktop'];
      check('an accessible surface passes', {
        script: 'check-a11y.mjs', args: args('accessible.html'), expect: 'pass',
      });
      /* The rule ENGINE §4 singles out — measured on the painted pixels, because the
         declared token pair can clear 4.5:1 while what lands on screen does not. */
      check('text below the contrast floor fails', {
        script: 'check-a11y.mjs', args: args('low-contrast.html'),
        expect: 'fail', because: 'color-contrast',
      });
      /* A screenshot cannot see either of these, which is why gate 3 passing says nothing
         about them. */
      check('an unlabelled input and a bare image fail', {
        script: 'check-a11y.mjs', args: args('unlabelled.html'),
        expect: 'fail', because: 'label',
      });
    }
  }

  /* ---------------- gate 3: render-verify ---------------- */
  if (group('render')) {
    console.log('\ngate 3 — render-verify');
    const fixtures = join(root, 'fixtures', 'render');
    const shots = join(fixtures, '_shots');

    let browserReady = false;
    try {
      const { chromium } = await import('playwright');
      browserReady = existsSync(chromium.executablePath());
    } catch { /* same handling as gate 4 */ }

    if (!browserReady) {
      console.log('  skip  gate 3 fixtures — no chromium binary; run `npm run preflight -- --fix`');
    } else {
      const args = f => [join(fixtures, f), '--medium', 'desktop', '--out', shots];
      /* Gate 3's verdict is a person looking at the image, so what is asserted here is
         everything that decides whether the image is worth looking at. A screenshot
         always succeeds — that is precisely why "it rendered" needed saying out loud. */
      check('a renderable page captures cleanly', {
        script: 'shoot.mjs', args: args('renderable.html'), expect: 'pass',
      });
      check('an empty first viewport fails', {
        script: 'shoot.mjs', args: args('blank.html'),
        expect: 'fail', because: 'nothing visible to photograph',
      });
      check('a shot taken mid-animation fails', {
        script: 'shoot.mjs', args: args('animating.html'),
        expect: 'fail', because: 'mid-flight',
      });
    }
  }

  /* ---------------- gate 4: interaction ---------------- */
  if (group('interactions')) {
    console.log('\ngate 4 — interaction');
    const fixtures = join(root, 'fixtures', 'interactions');
    const url = f => `file://${join(fixtures, f)}`;

    /* The browser binary is machine state, not a repo rule — the same class of dependency
       that made the catalog group fail on a fresh checkout. Say so and move on rather than
       reporting a red suite for a download nobody has run yet. */
    let browserReady = false;
    try {
      const { chromium } = await import('playwright');
      browserReady = existsSync(chromium.executablePath());
    } catch { /* package absent; handled the same way */ }

    if (!browserReady) {
      console.log('  skip  gate 4 fixtures — no chromium binary; run `npm run preflight -- --fix`');
    } else {
      check('a compliant surface passes', {
        script: 'check-interactions.mjs', args: [url('compliant.html')], expect: 'pass',
      });
      /* One poison per file, and `because` pins each failure to its own cause: the first
         version of this group passed on two fixtures that the gate never actually caught,
         because only the exit code was read. */
      check('a dead hover fails', {
        script: 'check-interactions.mjs', args: [url('dead-hover.html')],
        expect: 'fail', because: 'dead on hover',
      });
      check('an unpainted focus ring fails', {
        script: 'check-interactions.mjs', args: [url('no-focus-ring.html')],
        expect: 'fail', because: 'no ring on',
      });
      check('a ring painted by the mouse fails', {
        script: 'check-interactions.mjs', args: [url('ring-on-click.html')],
        expect: 'fail', because: 'ring after click',
      });
      check('motion surviving reduced-motion fails', {
        script: 'check-interactions.mjs', args: [url('motion-alive.html')],
        expect: 'fail', because: 'transitions suppressed',
      });
      check('a section left invisible fails', {
        script: 'check-interactions.mjs', args: [url('invisible-section.html')],
        expect: 'fail', because: 'nothing left invisible',
      });
      /* Both directions, and the pass half is the one that matters here: measuring with
         getBoundingClientRect made a translateY reveal — the technique this check exists
         to steer people toward — read as a reflow. A gate that fails the correct answer
         teaches the wrong lesson faster than one that misses the wrong answer. */
      check('a transform reveal is not a reflow', {
        script: 'check-interactions.mjs', args: [url('reflow-safe.html')], expect: 'pass',
      });
      check('a reveal that animates layout fails', {
        script: 'check-interactions.mjs', args: [url('reflow-shift.html')],
        expect: 'fail', because: 'moved',
      });

      /* The declaration half and the evidence half, joined. check-drift proves a brand
         SAID every section carries its device; this proves the device is in the render.
         Before they were wired together, a brand could declare the marker, ship a surface
         with the device gone, and collect a pass from one gate and a skip from the other —
         the shape the ledger exists to prevent. The fixture brand declares it; the
         compliant page has no [data-blank] at all, so the absence must now be a failure. */
      mkdirSync(brandDir, { recursive: true });
      writeDrift({ sectionMarker: 'data-blank' });
      check('a declared device missing from the render fails', {
        script: 'check-interactions.mjs',
        args: [url('compliant.html'), '--brand', BRAND],
        expect: 'fail', because: 'declares "data-blank"',
      });
      writeDrift(null);
      check('the same page passes when no device is declared', {
        script: 'check-interactions.mjs',
        args: [url('compliant.html'), '--brand', BRAND], expect: 'pass',
      });
    }
  }

  if (group('skills')) {
    console.log('\ncatalog — taste-only invariant');
    const catPath = join(root, 'catalog', 'authors.json');
    const original = readFileSync(catPath, 'utf8');
    try {
      /* --strict also fails on a missing INSTALLED skill, which is machine state: a
         fresh checkout has none of them, so asserting `pass` here made the suite depend
         on the developer's ~/.agents/skills. The catalog invariant is what this group
         tests, so it reads the report rather than the exit code.

         Reading the report is only half the fix. The first attempt matched the combined
         success line, which check-skills printed only once nothing was uninstalled — so
         the machine dependency survived the rewrite and a fresh checkout still failed
         here. The invariant now prints on its own line, and this matches that line. */
      const base = run('check-skills.mjs', []);
      const catalogClean = /✓ catalog invariant holds/.test(base.out);
      if (catalogClean) { passed++; console.log('  ok    the real catalog reports clean'); }
      else {
        failures.push('the real catalog reports clean');
        console.log('  FAIL  the real catalog reports clean');
        console.log(base.out.split(String.fromCharCode(10))
          .filter(l => /catalog:|✗|~/.test(l)).slice(0, 4)
          .map(l => `        | ${l}`).join(String.fromCharCode(10)));
      }

      /* A technique-pool skill in the author catalog is what let --diverge build a
         direction with no taste author. The check must derive its non-taste set rather
         than consult a hand-list, so a skill nobody remembered to blocklist still fails. */
      /* diagnose/tdd/triage appear in neither the manifest nor SKILLS.md — the exact
         gap that made two successive denylists leak. */
      for (const intruder of ['masked-reveal', 'apple-design', 'beautiful-shadows',
                              'diagnose', 'tdd', 'triage']) {
        const c = JSON.parse(original);
        c.authors[intruder] = {
          ground: 'either', temp: 'neutral', surface: 'flat', structure: 'modular',
          type: 'sans-utility', density: 'measured', motion: 'still', argues: 'fixture',
        };
        writeFileSync(catPath, JSON.stringify(c, null, 2));
        const r = run('check-skills.mjs', []);
        const caught = /missing kind:"taste"|classified as craft/.test(r.out);
        if (caught) { passed++; console.log(`  ok    a non-taste skill (${intruder}) is rejected`); }
        else {
          failures.push(`non-taste ${intruder} rejected`);
          console.log(`  FAIL  a non-taste skill (${intruder}) is rejected`);
        }
      }
    } finally {
      writeFileSync(catPath, original);
    }
  }
} finally {
  if (existsSync(brandDir)) rmSync(brandDir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map(f => `  - ${f}`).join('\n'));
  process.exit(1);
}
