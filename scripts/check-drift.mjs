/**
 * Gate 0b — drift check. Brand-level, runs on the built token set and, when given
 * surface files, on those too.
 *
 * Reframed 2026-07-29. It used to ask whether a brand's vocabulary could *express*
 * blur, gradient or glass, and fail it if so. That was backwards: slop is a completion
 * problem, not a vocabulary problem, and a token set that cannot express an effect has
 * only been made smaller. What it asks now is whether the set carries the decisions a
 * surface will need — states, contrast, differentiated scales — before any surface
 * exists. Brand-specific forbidden regions are opt-in via brands/<brand>/drift.json.
 *
 *   node scripts/check-drift.mjs <brand> [file...]
 *
 * Exit code is non-zero on any failure. Nothing here is advisory.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseOklch, oklchToHex } from './lib/color.mjs';

const [brand, ...files] = process.argv.slice(2);
if (!brand) {
  console.error('usage: node scripts/check-drift.mjs <brand> [file...]');
  process.exit(2);
}
const root = resolve(import.meta.dirname, '..');
const cssPath = resolve(root, `brands/${brand}/dist/tokens.css`);
if (!existsSync(cssPath)) {
  console.error(`no built tokens for "${brand}" — run build:tokens first`);
  process.exit(2);
}
const css = readFileSync(cssPath, 'utf8');

/* Brand-declared, opt-in rules. Absent file = nothing forbidden. */
const driftPath = resolve(root, `brands/${brand}/drift.json`);
const drift = existsSync(driftPath) ? JSON.parse(readFileSync(driftPath, 'utf8')) : {};

let fails = 0;
const fail = (rule, detail) => { console.log(`  FAIL  ${rule}\n        ${detail}`); fails++; };
const pass = (rule, detail = '') => console.log(`  pass  ${rule}${detail ? `  — ${detail}` : ''}`);

/* ---------- colour maths ---------------------------------------------------- */

const srgbToLinear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

const hexToRgb = h => {
  const s = h.replace('#', '');
  const n = s.length === 3 ? s.split('').map(c => c + c).join('') : s.slice(0, 6);
  const v = parseInt(n, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

const luminance = hex => {
  const [r, g, b] = hexToRgb(hex).map(c => srgbToLinear(c / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** sRGB hex → OKLCH. Used only for the cream-band test, so precision is ample. */
const oklch = hex => {
  const [R, G, B] = hexToRgb(hex).map(c => srgbToLinear(c / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const C = Math.hypot(a, bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
};

/* ---------- the token set --------------------------------------------------- */

const tokens = new Map(
  [...css.matchAll(/--ds-([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]),
);
/* Colours may be authored as hex OR as oklch() — ENGINE §2.3 makes oklch() the default
   for new brands, and this line used to match hex only. On an OKLCH brand every colour
   rule below then passed while examining nothing: the drift gate's own "a gate that
   skips silently is worse than one that fails" defect, found by a clone test 2026-07-29.
   oklch() is normalised to hex here, and zero colours is now itself a failure. */
const colorTokens = [...tokens]
  .map(([k, v]) => {
    if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return [k, v];
    const ok = parseOklch(v);
    return ok ? [k, oklchToHex(ok)] : null;
  })
  .filter(Boolean);

console.log(`\ndrift check — ${brand}  (${tokens.size} tokens, ${colorTokens.length} colours)\n`);

if (colorTokens.length === 0) {
  fail('the colour rules have something to check',
    'zero colour tokens parsed from tokens.css — either the brand declares none, or a ' +
    'notation this script cannot read reached the build. The colour rules below would ' +
    'pass vacuously, so this counts as a failure.');
}

/* 1. Per-brand forbidden regions — OPT-IN, declared in brands/<brand>/drift.json.
   A brand that rejected a coordinate at S1/S2 can have a return to it caught under a
   new name. There is no house-wide banned band: what one brand revoked is not a law
   for the next. Shape:
     { "forbid": [ { "name": "the revoked warm ground",
                     "L": [0.84, 0.97], "C": [0.004, 0.06], "H": [40, 100] } ] }   */
{
  const regions = drift.forbid ?? [];
  if (!regions.length) pass('no forbidden colour regions declared', 'brands/' + brand + '/drift.json absent');
  else {
    const within = (v, [lo, hi]) => v >= lo && v <= hi;
    for (const r of regions) {
      const hits = colorTokens.filter(([, v]) => {
        const c = oklch(v);
        return within(c.L, r.L ?? [0, 1]) && within(c.C, r.C ?? [0, 1]) && within(c.H, r.H ?? [0, 360]);
      });
      hits.length
        ? fail(`no colour inside "${r.name}"`,
            hits.map(([k, v]) => `--ds-${k} ${v} → ${(({ L, C, H }) => `L${L.toFixed(2)} C${C.toFixed(3)} H${H.toFixed(0)}`)(oklch(v))}`).join(', '))
        : pass(`no colour inside "${r.name}"`);
    }
  }
}

/* 2. Per-brand forbidden token NAMES, same opt-in file: { "forbidNames": ["cream"] }.
   Renaming a value is not enough if the vocabulary still reaches for the idea — but
   which ideas are off-limits is a brand's decision, not this file's.               */
{
  const words = drift.forbidNames ?? [];
  if (!words.length) pass('no forbidden token names declared');
  else {
    const re = new RegExp(`(^|-)(${words.join('|')})(-|$)`);
    const hits = [...tokens.keys()].filter(k => re.test(k));
    hits.length ? fail(`no token named ${words.join('/')}`, hits.join(', '))
                : pass(`no token named ${words.join('/')}`);
  }
}

/* 3. Differentiated scales. A surface cannot encode hierarchy with a vocabulary that
   has none. This replaces the old blur/gradient/glass ban, which policed which effects
   a brand could name rather than whether it could make distinctions.                */
{
  const stepsOf = re => [...tokens.keys()].filter(k => re.test(k)).length;
  const scales = [
    ['radius', stepsOf(/(^|-)radius(-|$)/)],
    ['spacing', stepsOf(/(^|-)space(-|$)/)],
    ['font weight', stepsOf(/(^|-)font-weight(-|$)/)],
  ].filter(([, n]) => n > 0);
  const thin = scales.filter(([, n]) => n < 2);
  if (!scales.length) pass('scale differentiation', 'no radius/space/weight scales to judge');
  else thin.length
    ? fail('every scale needs at least two usable steps',
        thin.map(([n]) => `${n} has ${scales.find(s2 => s2[0] === n)[1]}`).join(', ') +
        ' — one step everywhere is the uniformity gate 0 looks for')
    : pass('scale differentiation', scales.map(([n, c]) => `${n} ${c}`).join(', '));
}

/* 4. Contrast, decided at the token layer rather than discovered on a rendered page.
   Every S1 board failed AA on its tertiary ink; catching that in a browser is one
   stage too late, because by then the value is already written into four files. */
{
  /* Read from the normalised map, not the raw one: an oklch() ground is still a
     ground. Filtering on /^#/ here was the second half of the same silent-skip bug. */
  const hexOf = new Map(colorTokens);
  const grounds = [...hexOf].filter(([k]) => /^surface-/.test(k));
  const inks = [...hexOf].filter(([k]) => /^text-/.test(k));
  const pairs = [
    ...inks.filter(([k]) => !/on-inverse/.test(k)).map(([k, v]) => [k, v, 'surface-page']),
    ...inks.filter(([k]) => /on-inverse/.test(k)).map(([k, v]) => [k, v, 'surface-inverse']),
  ];
  const bad = pairs
    .filter(([, , g]) => hexOf.has(g))
    .map(([k, v, g]) => [k, g, contrast(v, hexOf.get(g))])
    .filter(([, , r]) => r < 4.5);
  if (!grounds.length || !inks.length) fail('text and surface roles exist to pair',
    `found ${grounds.length} surface-* and ${inks.length} text-* colour roles. A brand ` +
    'with no pairable roles cannot have its contrast judged here, which is the exact ' +
    'thing this rule exists to prevent.');
  else bad.length
    ? fail('every text role must clear 4.5:1 on its ground',
        bad.map(([k, g, r]) => `--ds-${k} on --ds-${g} = ${r.toFixed(2)}`).join(', '))
    : pass('token-level contrast', `${pairs.length} text/ground pairs ≥ 4.5:1`);
}

/* 5. State tokens exist. Their absence is not a gap, it is the specific defect that
   shipped a dead interface: the first build passed every gate with no hover or focus
   state anywhere, because nothing obliged them to exist before components were built. */
{
  const need = ['hover', 'press', 'focus'];
  const missing = need.filter(n => ![...tokens.keys()].some(k => k.includes(n)));
  missing.length
    ? fail('hover, press and focus must exist as tokens', `missing: ${missing.join(', ')}`)
    : pass('state tokens declared', need.join(' / '));
}

/* ---------- surfaces, when given -------------------------------------------- */

for (const f of files) {
  const path = resolve(root, f);
  const src = readFileSync(path, 'utf8');
  console.log(`\n  ${f}`);

  /* 6. Brand-declared surface rules, from the same opt-in drift.json.
     What used to sit here was a house-wide ban on backdrop-filter, gradient fills and
     box-shadow — the vocabulary fallacy again, surviving in the surface half after the
     token half was fixed (found by an audit 2026-07-29). Effects are not defects. A
     brand that decided against one may still say so:
       { "forbidCss": [ { "name": "no gradient fills", "pattern": "background[^;]*gradient\(" } ] }  */
  {
    const rules = drift.forbidCss ?? [];
    if (!rules.length) pass('no surface CSS rules declared');
    else for (const r of rules) {
      new RegExp(r.pattern).test(src)
        ? fail(`surface breaks "${r.name}"`, r.pattern)
        : pass(`surface honours "${r.name}"`);
    }
  }

  /* 7. Signature-device ledger, source half — OPT-IN per brand.
     A brand whose S2 lock names a device can require every section to declare it, so
     "this section drifted to the default" becomes mechanical rather than a matter of
     memory. The marker is the brand's own; `data-blank` was one brand's, and hardcoding
     it here made every other brand fail a rule it had never agreed to.
       { "sectionMarker": "data-blank" }
     A declaration is a promise, not evidence. The evidence half belongs in the project's
     own interaction check, against the rendered DOM, and both must pass. */
  if (drift.sectionMarker && /<section|<header/.test(src)) {
    const attr = drift.sectionMarker;
    const opens = [...src.matchAll(/<(section|header)([^>]*)>/g)];
    const naked = opens
      .map((m, i) => [i, m[0].slice(0, 90).replace(/\s+/g, ' '),
        new RegExp(`${attr}\\s*=`).test(m[2])])
      .filter(([, , has]) => !has);
    if (!opens.length)
      fail(`the ${attr} ledger found sections to check`,
        'the file contains <section>/<header> text but the scan matched none — a check ' +
        'that silently examines nothing is a failure, not a pass');
    else naked.length
      ? fail(`every section must declare ${attr} (ledger, source half)`,
          naked.map(([i, head]) => `#${i} ${head}…`).join('\n        '))
      : pass(`${attr} ledger — declared`, `${opens.length} sections`);
  }
}

console.log(`\n${fails ? `${fails} FAILURE(S)` : 'no drift'}\n`);
process.exit(fails ? 1 : 0);
