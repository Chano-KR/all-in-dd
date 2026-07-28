/**
 * Drives an S1 board instead of photographing it.
 *
 * Written for the restart round. The first run's boards were still sheets, and a still sheet
 * cannot show a layer-3 direction at all — sequence, physics and transition are invisible in
 * it. This is ENGINE §4 gate 4 pulled one stage earlier, plus gate 3 in the same pass.
 *
 *   node _drive.mjs n1            # one board, by filename prefix
 *   node _drive.mjs               # every board in the folder
 *
 * Shots land in _shots/. Assertions print to stdout and set a non-zero exit on failure.
 */
import { chromium } from 'playwright';
import { readdirSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dir = resolve(import.meta.dirname);
const out = join(dir, '_shots');
mkdirSync(out, { recursive: true });

const only = process.argv[2];
const boards = readdirSync(dir)
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .filter(f => !only || f.startsWith(only));

if (!boards.length) { console.error('no boards matched', only ?? '(all)'); process.exit(1); }

const url = f => 'file:///' + join(dir, f).replace(/\\/g, '/');
const browser = await chromium.launch();
let failures = 0;

const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
  if (!ok) failures++;
};

for (const f of boards) {
  const board = f.replace('.html', '');
  console.log(`\n── ${board}`);

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(url(f));
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);   // let any load-in settle before the first frame
  // Korean subsets arrive after fonts.ready reports on some runs; give them a beat.
  await page.evaluate(() => new Promise(r => setTimeout(() => document.fonts.ready.then(r), 600)));

  /* ── gate 3: what it actually looks like ─────────────────────────────── */
  await page.screenshot({ path: join(out, `${board}-1440-hero.png`) });

  /* ── the Korean webface is really applied, not an OS fallback ─────────── */
  const fontReport = await page.evaluate(() => {
    // Probe each family with text the page actually sets in it. Google Fonts splits
    // Korean into lazily-fetched unicode-range subsets, so neither a Latin string nor
    // an arbitrary Hangul pair proves anything: only the glyphs in use are fetched.
    // …and probe at the weight the element actually asks for. A family used only at
    // 600 never downloads its 400 face, so a fixed-weight probe reports it missing.
    const byFam = new Map();
    for (const el of document.querySelectorAll('*')) {
      if (!el.getClientRects().length) continue;
      const cs = getComputedStyle(el);
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if (!fam) continue;
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      if (!own) continue;
      if (!byFam.has(fam)) byFam.set(fam, { sample: own.slice(0, 14), w: cs.fontWeight });
    }
    const loaded = [...byFam].map(([fam, u]) => ({
      fam,
      ok: document.fonts.check(`${u.w} 16px "${fam}"`, u.sample),
    }));

    // A Hangul string must render at a different width under the declared face than under a
    // forced generic. If they match, the face never applied and Hangul fell back to the OS.
    const probe = document.createElement('span');
    probe.textContent = '학원 원장이 읽는 문장 1,001';
    probe.style.cssText = 'position:absolute;left:-9999px;font-size:40px;white-space:nowrap';
    document.body.appendChild(probe);
    const first = getComputedStyle(document.body).fontFamily;
    probe.style.fontFamily = first;
    const wDeclared = probe.getBoundingClientRect().width;
    probe.style.fontFamily = 'monospace';
    const wFallback = probe.getBoundingClientRect().width;
    probe.remove();
    return { loaded, wDeclared, wFallback, first };
  });
  check('korean webface loaded',
    fontReport.loaded.every(l => l.ok) && Math.abs(fontReport.wDeclared - fontReport.wFallback) > 1,
    fontReport.loaded.map(l => `${l.fam}:${l.ok ? 'ok' : 'MISSING'}`).join(' '));

  /* ── Hangul leading floors (gate 0, Korean §6) ────────────────────────────
     The gate reads "Korean *body* line-height below ~1.5". Two floors, not one:
     forcing 1.5 onto a 6rem display line is a setting error, not compliance. So
     body copy answers to 1.5 and display answers to 1.2, and both are checked —
     the split is faithful to the gate text, it is not a relaxation of it.       */
  const leading = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('p,li,dd,span,h1,h2,h3,a')) {
      const t = el.textContent || '';
      if (!/[가-힣]/.test(t) || !el.getClientRects().length) continue;
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      const ratio = parseFloat(cs.lineHeight) / px;
      if (!Number.isFinite(ratio)) continue;
      const floor = px >= 28 ? 1.2 : 1.5;      // 28px is where display setting begins
      // epsilon: 39px/26px is 1.4999…, and a board should not fail on binary rounding
      if (ratio < floor - 0.005) bad.push(`${el.tagName}.${el.className} ${px.toFixed(0)}px ${ratio.toFixed(3)}<${floor}`);
    }
    return bad;
  });
  check('hangul leading (body ≥1.5, display ≥1.2)', leading.length === 0, leading.slice(0, 4).join(' | '));

  const wordBreak = await page.evaluate(() =>
    [...document.querySelectorAll('p,li,dd')]
      .filter(el => /[가-힣]/.test(el.textContent || '') && el.getClientRects().length)
      .filter(el => getComputedStyle(el).wordBreak !== 'keep-all').length);
  check('word-break: keep-all on Korean copy', wordBreak === 0, `${wordBreak} element(s) without it`);

  const faux = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter(el => /[가-힣]/.test(el.textContent || '') && el.getClientRects().length)
      .some(el => getComputedStyle(el).webkitTextStrokeWidth !== '0px'));
  check('no faux bold on Hangul', !faux);

  /* ── gate 0, the mechanically checkable half ──────────────────────────── */
  const slop = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')].filter(el => el.getClientRects().length);
    const cs = el => getComputedStyle(el);
    return {
      glass: all.some(el => {
        const b = cs(el).backdropFilter;
        return b && b !== 'none';
      }),
      purple: all.some(el => {
        const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(cs(el).backgroundColor + cs(el).color);
        if (!m) return false;
        const [r, g, b] = [+m[1], +m[2], +m[3]];
        return b > 150 && b - g > 55 && r > 90 && r < 190 && Math.abs(r - b) < 110;
      }),
      // heading family must differ from body family
      headingSharesBody: (() => {
        const h = document.querySelector('h1');
        return h ? cs(h).fontFamily === cs(document.body).fontFamily : false;
      })(),
      // Buttons, cards and inputs must not ALL share one *rounded* radius — that
      // undifferentiated soft rounding is the actual slop tell, and the model's
      // default is always rounded, never square. A board that commits to 0px
      // everywhere has made a decision, not fallen into a default, so it passes;
      // a board where everything is 8px has not.
      radiiCollapse: (() => {
        const r = new Set(
          all.filter(el => /^(a|button|article|input|span)$/i.test(el.tagName) || /card|row|strat|cta/.test(String(el.className)))
             .map(el => cs(el).borderRadius),
        );
        return r.size === 1 && ![...r][0].startsWith('0px');
      })(),
      // uniform vertical rhythm across every section is a slop tell
      uniformPadding: (() => {
        const p = [...document.querySelectorAll('section,header')].map(el => cs(el).paddingTop);
        return p.length > 2 && new Set(p).size === 1;
      })(),
    };
  });
  check('no glassmorphism', !slop.glass);
  check('accent is not purple/indigo', !slop.purple);
  check('heading family ≠ body family', !slop.headingSharesBody);
  check('radii differ across control types', !slop.radiiCollapse);
  check('section rhythm is not uniform', !slop.uniformPadding);

  /* ── gate 2: contrast, against the rendered surface not the intended one ── */
  const contrast = await page.evaluate(() => {
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
    const bgOf = el => {
      for (let n = el; n; n = n.parentElement) {
        const c = rgb(getComputedStyle(n).backgroundColor);
        if (c.length >= 3 && (c[3] === undefined || c[3] > 0.85)) return c;
      }
      return [255, 255, 255];
    };
    const bad = [];
    for (const el of document.querySelectorAll('p,span,a,li,dd,dt,h1,h2,h3,i,b,em,button,summary')) {
      if (!el.getClientRects().length) continue;
      const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const cs = getComputedStyle(el);
      if (+cs.opacity === 0 || cs.visibility === 'hidden') continue;
      const fg = rgb(cs.color);
      if (fg[3] !== undefined && fg[3] < 0.6) continue;      // deliberately faded, not body copy
      const px = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight, 10) || 400;
      const large = px >= 24 || (px >= 18.66 && w >= 700);
      const L1 = lum(fg), L2 = lum(bgOf(el));
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const floor = large ? 3 : 4.5;
      if (ratio < floor - 0.02) bad.push(`${el.tagName}.${String(el.className).slice(0,18)} ${px.toFixed(0)}px ${ratio.toFixed(2)}<${floor}`);
    }
    return bad;
  });
  check('contrast (4.5 body / 3.0 large)', contrast.length === 0, contrast.slice(0, 5).join(' | '));

  /* ── gate 4: scroll actually drives something ─────────────────────────── */
  // The signature element may itself sit still while its children carry the motion
  // (a pinned stage whose beats move). Snapshot the subtree, not just the node.
  const DRIVEN = '[data-drive], [data-mass], .strat, .stage-item';
  const sign = `(() => {
    const root = document.querySelector('${DRIVEN}');
    if (!root) return null;
    const nodes = [root, ...root.querySelectorAll('*')].slice(0, 12);
    return nodes.map(n => getComputedStyle(n).transform + ':' + getComputedStyle(n).opacity).join('|');
  })()`;
  const driven = await page.evaluate(sign).then(before => ({ has: before !== null, before }));

  if (driven.has) {
    const marks = [0.3, 0.6, 1.0];
    const seen = [];
    for (const m of marks) {
      await page.evaluate(p => {
        const doc = document.documentElement;
        window.scrollTo(0, (doc.scrollHeight - innerHeight) * p);
      }, m);
      await page.waitForTimeout(450);
      seen.push(await page.evaluate(sign));
      await page.screenshot({ path: join(out, `${board}-1440-scroll-${String(m).replace('.', '')}.png`) });
    }
    check('scroll drives the signature element', new Set([driven.before, ...seen]).size > 1,
      `${new Set([driven.before, ...seen]).size} distinct states`);
  } else {
    check('scroll drives the signature element', false, 'no driven element found');
  }

  /* ── gate 4: hover changes something ──────────────────────────────────── */
  // A board with nothing hoverable must fail here rather than skip quietly. Silent
  // skips are how the first build shipped with no hover states while passing gates.
  const target = await page.$('.row, .strat, .band, .cell, .vol__hd, a[href], button, summary');
  check('a hoverable target exists', !!target);
  if (target) {
    await target.scrollIntoViewIfNeeded();
    const snap = el => el.evaluate(n => {
      const c = getComputedStyle(n), a = getComputedStyle(n, '::after');
      return [c.backgroundColor, c.color, c.transform, c.borderColor, a.transform, a.opacity].join('|');
    });
    const cold = await snap(target);
    await target.hover();
    await page.waitForTimeout(500);
    const hot = await snap(target);
    check('hover changes something', cold !== hot);
    await page.screenshot({ path: join(out, `${board}-1440-hover.png`) });
  }

  /* ── gate 4: keyboard focus paints a ring, a mouse click does not ─────── */
  const focus = await page.evaluate(async () => {
    const el = document.querySelector('a[href], button');
    if (!el) return null;
    el.focus();
    const kb = getComputedStyle(el).outlineWidth + ' ' + getComputedStyle(el).outlineStyle;
    return { kb, matches: el.matches(':focus-visible') };
  });
  if (focus) {
    check('keyboard focus paints a visible ring', focus.matches && !/^0px|none$/.test(focus.kb), focus.kb);
    await page.screenshot({ path: join(out, `${board}-1440-focus.png`) });
  }

  /* ── the whole page, and the small viewport ───────────────────────────── */
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `${board}-1440-full.png`), fullPage: true });
  await page.setViewportSize({ width: 375, height: 780 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(out, `${board}-375-full.png`), fullPage: true });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no horizontal overflow at 375', overflow <= 1, `${overflow}px`);
  await page.close();

  /* ── gate 4: reduced motion keeps the states, drops the movement ──────── */
  const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
  await rm.goto(url(f));
  await rm.waitForLoadState('networkidle');
  await rm.evaluate(() => document.fonts.ready);
  await rm.waitForTimeout(700);
  const rmReport = await rm.evaluate(() => {
    // Scoped to content blocks. The gate exists because the first chunaimun build
    // left whole sections invisible without motion — not to police an inline
    // placeholder that is deliberately swapped for the value it stands in for.
    const hidden = [...document.querySelectorAll('section, article, [data-beat], [data-mass], [data-drive] > *, .strat, .band, .beat')]
      .filter(el => (el.textContent || '').trim().length > 0)
      .filter(el => el.getClientRects().length && +getComputedStyle(el).opacity === 0).length;
    const slowest = Math.max(0, ...[...document.querySelectorAll('*')]
      .flatMap(el => getComputedStyle(el).transitionDuration.split(',').map(d => parseFloat(d) || 0)));
    return { hidden, slowest };
  });
  check('reduced-motion: nothing left invisible', rmReport.hidden === 0, `${rmReport.hidden} hidden`);
  check('reduced-motion: transitions suppressed', rmReport.slowest <= 0.05, `${rmReport.slowest}s`);
  await rm.screenshot({ path: join(out, `${board}-reduced.png`), fullPage: true });
  await rm.close();
}

await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
