/* Gate 3 — render-verify. Screenshots a page at the medium's real target dimensions.

   The verdict here is a person looking at the image, and that is exactly why the capture
   itself has to be checked by something else. A screenshot always succeeds: a page that
   never laid out, a webfont that had not arrived, a viewport nobody meant to use — all of
   them produce a PNG, and a PNG is what the gate hands over for review. "It rendered" was
   never asserted, only assumed.

   So three things are now claimed, and the script exits non-zero when any fails:
     1. the shot is at the medium's stated size (ENGINE §4 gate 3 names them)
     2. the frame is not blank — something visible sits in the first viewport
     3. the page had settled — fonts resolved, no element still mid-transition

   Usage: node scripts/shoot.mjs <file> [--medium slides|cards|mobile|desktop|all]
                                        [--out <dir>] [--width N --height N]        */

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';

/* ENGINE §4 gate 3: "1920×1080 slides, 1080×1080 cards, A4 PDF, 375px + 1440px web".
   A4 is Typst's output, not a browser's, so it is proven by print:example instead. The
   list lives here rather than in each caller's head — "screenshot at real target
   dimensions" is not a rule anyone can follow if the dimensions are folk knowledge. */
const MEDIA = {
  slides: { width: 1920, height: 1080 },
  cards: { width: 1080, height: 1080 },
  mobile: { width: 375, height: 812 },
  desktop: { width: 1440, height: 1200 },
};

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};
const file = argv.find(a => !a.startsWith('--') && argv[argv.indexOf(a) - 1]?.startsWith('--') !== true);
if (!file) {
  console.error('usage: node scripts/shoot.mjs <file> [--medium slides|cards|mobile|desktop|all] [--out dir]');
  process.exit(2);
}

const width = flag('width'), height = flag('height');
const mediumArg = flag('medium') ?? (width && height ? 'custom' : 'desktop');
const targets = mediumArg === 'all' ? Object.entries(MEDIA)
  : mediumArg === 'custom' ? [['custom', { width: Number(width), height: Number(height) }]]
    : MEDIA[mediumArg] ? [[mediumArg, MEDIA[mediumArg]]]
      : null;
if (!targets) {
  console.error(`unknown medium "${mediumArg}" — one of: ${Object.keys(MEDIA).join(', ')}, all`);
  process.exit(2);
}

const DPR = 2;
const path = resolve(file);
const out = resolve(flag('out') ?? join(dirname(path), '_shots'));
mkdirSync(out, { recursive: true });

/* Read the size straight out of the PNG's IHDR rather than trusting the request. The
   viewport asked for is not the frame produced — a page with a horizontal overflow, or a
   deviceScaleFactor that silently did not apply, yields a differently sized image and
   nobody notices until the deck is on a projector. Bytes 16..24, big-endian. */
const pngSize = (p) => {
  const b = readFileSync(p);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};

let failures = 0;
const check = (pass, what, detail = '') => {
  if (!pass) failures++;
  console.log(`  ${pass ? 'pass' : 'FAIL'}  ${what}${detail ? `  — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const name = basename(path).replace(/\.html$/, '');

for (const [medium, size] of targets) {
  console.log(`\n${medium}  ${size.width}×${size.height}`);
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: DPR });
  await page.goto('file:///' + path.replace(/\\/g, '/'));
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  /* Settled, asked of the page rather than waited out. A fixed timeout is a guess that
     passes on a fast machine and captures a half-drawn frame on a slow one — and gate 3's
     whole product is that frame. */
  const state = await page.evaluate(() => {
    const running = document.getAnimations
      ? document.getAnimations().filter(a => a.playState === 'running').length : 0;
    const vh = innerHeight, vw = innerWidth;
    /* Something a reader would actually see in the first viewport: laid out, on screen,
       not transparent, and carrying text or being an image. */
    const visible = [...document.body.querySelectorAll('*')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return false;
      if (r.width < 2 || r.height < 2) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || +cs.opacity === 0) return false;
      return el.tagName === 'IMG' || el.tagName === 'SVG' || el.tagName === 'CANVAS'
        || [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    }).length;
    return { running, visible, fontsReady: document.fonts.status === 'loaded' };
  });

  check(state.fontsReady, 'fonts resolved before capture',
    state.fontsReady ? '' : `document.fonts.status = ${state.fontsReady}`);
  check(state.running === 0, 'no animation still running',
    state.running ? `${state.running} animation(s) mid-flight` : '');
  check(state.visible > 0, 'first viewport is not blank',
    state.visible ? `${state.visible} visible element(s)` : 'nothing visible to photograph');

  const top = join(out, `${name}-${medium}-top.png`);
  const full = join(out, `${name}-${medium}-full.png`);
  await page.screenshot({ path: top });
  await page.screenshot({ path: full, fullPage: true });
  await page.close();

  const got = pngSize(top);
  const want = { width: size.width * DPR, height: size.height * DPR };
  check(got.width === want.width && got.height === want.height, 'shot is at the target size',
    `${got.width}×${got.height}${got.width === want.width && got.height === want.height
      ? '' : `, expected ${want.width}×${want.height}`}`);

  console.log(`  ${top.replace(process.cwd() + '/', '')}`);
  console.log(`  ${full.replace(process.cwd() + '/', '')}  (${statSync(full).size} bytes)`);
}

await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'render-verify: captures are sound — now look at them'}`);
process.exit(failures ? 1 : 0);
