/**
 * Gate 0b — drift check. Brand-level, runs on the built token set and, when given
 * surface files, on those too.
 *
 * Written at chunaimun S3, 2026-07-28, because the four S1 boards all passed every
 * gate and three of the four still needed correcting. Gates 0–4 ask "is this the
 * model's distributional default?" one artefact at a time. This one asks a narrower
 * and more useful question: **can this brand's vocabulary even express the default?**
 * A token set that cannot say "soft warm blur" cannot drift there under deadline.
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

/* 1. The cream / sand / bone band.
   impeccable calls the warm near-white the saturated AI default; S0 §4.6 names it as
   this specific process's own default, and the revoked chunaimun lock sat on it. It is
   a measurable region, so it is measured rather than trusted to taste. */
{
  /* No lower bound on chroma. The first version required C > 0.012 to avoid flagging
     true neutrals, and #E6E3DC — the revoked lock's own ground — slipped straight
     through it: the warm near-white is warm by hue, not by saturation. Pure neutrals
     are excluded by hue instead, which is what actually distinguishes them. */
  const band = colorTokens.filter(([, v]) => {
    const { L, C, H } = oklch(v);
    /* C > 0.004 only to drop the arithmetic noise: at chroma zero the hue is an
       arbitrary atan2 of two near-zero numbers, so a pure grey reports as "warm".
       The revoked ground sits at C 0.010, comfortably above this floor. */
    return L >= 0.84 && L <= 0.97 && C > 0.004 && C < 0.06 && H >= 40 && H <= 100;
  });
  band.length
    ? fail('no colour in the cream/sand band (OKLCH L .84–.97, C < .06, H 40–100)',
        band.map(([k, v]) => `--ds-${k} ${v} → ${(({ L, C, H }) => `L${L.toFixed(2)} C${C.toFixed(3)} H${H.toFixed(0)}`)(oklch(v))}`).join(', '))
    : pass('no colour in the cream/sand band');
}

/* 2. Names that are tells in themselves. Renaming the value is not enough if the
   vocabulary still reaches for the idea. */
{
  const banned = /(^|-)(paper|cream|sand|bone|flour|linen|parchment|wheat|biscuit|ivory|beige)(-|$)/;
  const hits = [...tokens.keys()].filter(k => banned.test(k));
  hits.length
    ? fail('no token named paper/cream/sand/bone/…', hits.join(', '))
    : pass('no warm-neutral token names');
}

/* 3. Vocabulary restriction. The brand cannot own words for the three effects that
   carry most AI-default surfaces. If the token set has no way to say them, a surface
   under deadline has no shortcut to them either. */
{
  const forbidden = [
    [/blur/, 'blur'],
    [/gradient/, 'gradient'],
    [/(^|-)shadow(-|$)/, 'shadow'],
    [/glass|frost/, 'glass'],
  ];
  const hits = forbidden
    .map(([re, name]) => [name, [...tokens.keys()].filter(k => re.test(k))])
    .filter(([, ks]) => ks.length);
  hits.length
    ? fail('the token set must not be able to express blur / gradient / shadow / glass',
        hits.map(([n, ks]) => `${n}: ${ks.join(' ')}`).join(' | '))
    : pass('vocabulary cannot express blur, gradient, shadow or glass');
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

  /* 6. The effects themselves, in case a surface writes them literally rather than
     reaching for a token that does not exist. */
  {
    const hits = [
      [/backdrop-filter\s*:(?!\s*none)/, 'backdrop-filter'],
      [/filter\s*:[^;]*blur\(/, 'filter: blur()'],
      /* A gradient used as a FILL is the tell — the two-hue hero wash, the mesh, the
         tinted card. A gradient used as a mask is not a fill at all; it is how an image
         is faded into the page instead of being pasted onto it as a rectangle. The rule
         is narrowed to what it was aimed at rather than waived. */
      [/background(-image|-color)?\s*:[^;]*gradient\(/, 'gradient fill'],
      [/border-image\s*:[^;]*gradient\(/, 'gradient border'],
      [/box-shadow\s*:(?!\s*none)/, 'box-shadow'],
    ].filter(([re]) => re.test(src)).map(([, n]) => n);
    hits.length
      ? fail('surface must not use blur, gradient or shadow', hits.join(', '))
      : pass('no blur, gradient or shadow in the surface');
  }

  /* 7. The blank ledger, source half — the S2 lock's countermeasure made mechanical.
     The lock says a section with no blank being filled, drawn, or waiting has drifted
     to the default; prose cannot enforce that, a required marker can.

     This half only checks that every section *declares* a blank. A declaration is a
     promise, not evidence — the device itself usually lives inside a component and is
     not textually present here. The evidence half runs against the rendered DOM in
     chunaimun-site/scripts/check-interactions.mjs, and both have to pass. */
  if (/<section|<header/.test(src)) {
    const opens = [...src.matchAll(/<(section|header)\b([^>]*)>/g)];
    const naked = opens
      .map((m, i) => [i, m[0].slice(0, 90).replace(/\s+/g, ' '), /data-blank\s*=\s*["'{][^"'}]+/.test(m[2])])
      .filter(([, , has]) => !has);
    naked.length
      ? fail('every section must declare data-blank (the ledger, source half)',
          naked.map(([i, head]) => `#${i} ${head}…`).join('\n        '))
      : pass('blank ledger — declared', `${opens.length} sections`);
  }
}

console.log(`\n${fails ? `${fails} FAILURE(S)` : 'no drift'}\n`);
process.exit(fails ? 1 : 0);
