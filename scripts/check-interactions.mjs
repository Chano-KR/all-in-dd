/* Interaction check — gate 4, plus the blank ledger's evidence half.
   Gate 3 (render-verify) is a screenshot, and a screenshot cannot see a hover state, a
   focus ring, a suppressed transition, or a section that quietly stopped carrying the
   brand's signature device. That blind spot is exactly how the first build shipped with
   no hover or focus states at all while passing every gate.

   Rebuilt at S4 for direction N3 「연쇄」.
   Usage: node scripts/check-interactions.mjs [baseUrl]                                  */

import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3000';
let failures = 0;
const check = (name, pass, detail = '') => {
  if (!pass) failures++;
  console.log(`${pass ? 'pass' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const browser = await chromium.launch();

/* ── normal motion ─────────────────────────────────────────────────────────── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);

  /* The blank ledger, evidence half. The source half (check-drift.mjs) only proves a
     section *declared* a blank, which is a promise. This proves the device is actually
     in the rendered section: a blank, the cycling output word, or a row that draws its
     own rule on hover. */
  {
    const report = await page.evaluate(() =>
      [...document.querySelectorAll('[data-blank]')].map((s) => ({
        id: s.getAttribute('data-blank'),
        has: !!s.querySelector('.blank, .cycle, .row'),
      })));
    const naked = report.filter((r) => !r.has);
    check('blank ledger — rendered', report.length > 0 && naked.length === 0,
      naked.length ? `no blank device in: ${naked.map((r) => r.id).join(', ')}` : `${report.length} sections`);
  }

  /* Hover changes something, and it draws the brand's own device rather than a tint. */
  {
    const row = page.locator('.row').first();
    await row.scrollIntoViewIfNeeded();
    const snap = () => row.evaluate((n) => {
      const c = getComputedStyle(n), a = getComputedStyle(n, '::after');
      return [c.backgroundColor, a.transform].join('|');
    });
    const cold = await snap();
    await row.hover();
    await page.waitForTimeout(500);
    const hot = await snap();
    check('row hover draws its own blank', cold !== hot, cold === hot ? 'no change' : '');
  }

  /* Keyboard focus paints a ring. */
  {
    const info = await page.evaluate(() => {
      const el = document.querySelector('a[href], button');
      if (!el) return null;
      el.focus();
      const cs = getComputedStyle(el);
      return { visible: el.matches(':focus-visible'), width: cs.outlineWidth, style: cs.outlineStyle };
    });
    check('keyboard focus paints a ring',
      !!info && info.visible && info.style !== 'none' && parseFloat(info.width) > 0,
      info ? `${info.width} ${info.style}` : 'no focusable element');
  }

  /* The button responds to the press itself, not to the release. */
  {
    const btn = page.locator('.btn').first();
    await btn.scrollIntoViewIfNeeded();
    const box = await btn.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(140);
    const pressed = await btn.evaluate((n) => getComputedStyle(n).transform);
    await page.mouse.up();
    check('button responds on press', pressed !== 'none', pressed);
  }

  /* Scroll drives the chain, and driving it backwards un-fills it. Reversibility is the
     difference between an instrument and a video, and it is the whole claim of N3. */
  {
    const filled = () => page.evaluate(() =>
      document.querySelectorAll('.blank[data-filled="true"]').length);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
    const atTop = await filled();
    await page.evaluate(() => {
      const r = document.getElementById('chain').getBoundingClientRect();
      scrollTo(0, scrollY + r.top + r.height * 0.3);
    });
    await page.waitForTimeout(700);
    const midway = await filled();
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(700);
    const back = await filled();
    check('scroll fills the blanks', midway > atTop, `${atTop} → ${midway}`);
    check('scrolling back un-fills them', back <= atTop, `${midway} → ${back}`);
  }

  /* The sentence must light up as the reader reaches it, not sit dimmed while its blanks
     fill. That is what the first S4 build shipped — the words never brightened, so the
     sentence read as a rendering fault. Asserted so it cannot regress quietly. */
  {
    const litCount = () => page.evaluate(() =>
      document.querySelectorAll('.sentence .w[data-lit="true"]').length);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
    const atTop = await litCount();
    await page.evaluate(() => {
      const r = document.getElementById('chain').getBoundingClientRect();
      scrollTo(0, scrollY + r.top + r.height * 0.2);
    });
    await page.waitForTimeout(700);
    const lit = await litCount();
    check('scroll lights the sentence', lit > atTop, `${atTop} → ${lit} words`);
  }

  /* The output word cycles, and the text after it tracks its width. */
  {
    const read = () => page.evaluate(() => {
      const on = document.querySelector('.cycle__word[data-on="true"]');
      const tail = document.querySelector('.cycle__tail');
      return { word: on?.textContent ?? '', x: Math.round(tail.getBoundingClientRect().left) };
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
    const a = await read();
    await page.waitForTimeout(3600);
    const b = await read();
    check('the output word cycles', a.word !== b.word, `${a.word} → ${b.word}`);
    check('the tail tracks the word width', a.word === b.word || a.x !== b.x, `x ${a.x} → ${b.x}`);
  }

  await ctx.close();
}

/* ── reduced motion: the movement goes, every state survives ────────────────── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);

  const r = await page.evaluate(() => ({
    slowest: Math.max(0, ...[...document.querySelectorAll('*')]
      .flatMap((el) => getComputedStyle(el).transitionDuration.split(',').map((d) => parseFloat(d) || 0))),
    hidden: [...document.querySelectorAll('section, header, .beat')]
      .filter((el) => el.getClientRects().length && +getComputedStyle(el).opacity === 0).length,
    /* Only the scroll-driven blanks. The blank that closes the page is meant to stay
       waiting in every mode — that is its whole point — so it is not a failure here. */
    unfilled: document.querySelectorAll('.blank[data-driven="true"]:not([data-filled="true"])').length,
    words: document.querySelectorAll('.cycle__word').length,
    shown: [...document.querySelectorAll('.cycle__word')].filter((el) => el.getClientRects().length).length,
  }));

  check('reduced motion: transitions suppressed', r.slowest <= 0.05, `${r.slowest}s`);
  check('reduced motion: nothing left invisible', r.hidden === 0, `${r.hidden} hidden`);
  check('reduced motion: blanks are already filled', r.unfilled === 0, `${r.unfilled} unfilled`);
  check('reduced motion: one output word, statically', r.shown === 1, `${r.shown} of ${r.words} visible`);

  await ctx.close();
}

await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'all interaction checks passed'}`);
process.exit(failures ? 1 : 0);
