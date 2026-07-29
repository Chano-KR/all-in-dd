/* Interaction check — gate 4, plus the blank ledger's evidence half.
   Gate 3 (render-verify) is a screenshot, and a screenshot cannot see a hover state, a
   focus ring, a suppressed transition, or a section that quietly stopped carrying the
   brand's signature device. That blind spot is exactly how the first build shipped with
   no hover or focus states at all while passing every gate.

   Two tiers, because ENGINE §4 gate 4 states a minimum for *any* surface with state and
   then says to adapt this file per project. Mixing them cost the gate its reach: every
   assertion was written against direction N3 「연쇄」's markup, so pointing it at any other
   page threw on a null element instead of reporting — a crash reads as a broken gate,
   and a broken gate gets skipped.

     universal — the §4 minimum. Runs everywhere, fails everywhere.
     brand     — the signature device. Runs only where the page declares its hooks, and
                 says out loud when it skipped. Silence would let a page that quietly
                 dropped the device report the same clean run as one that never had it.

   Rebuilt at S4 for direction N3 「연쇄」; universal tier split out 2026-07-29.
   Usage: node scripts/check-interactions.mjs [baseUrl]                                  */

import { chromium } from 'playwright';

const base = process.argv.slice(2).find(a => !a.startsWith('--')) ?? 'http://localhost:3000';

/* Every element would be correct and too slow — each one costs a hover and a settle. So
   there is a cap, and the cap is stated in the output rather than hidden in the pass: a
   check that silently examined 8 of 40 elements reports the same "pass" as one that
   examined all 40, which is how a bound becomes a lie. Raise it with --sample N. */
const SAMPLE = (() => {
  const i = process.argv.indexOf('--sample');
  const n = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 24;
})();
const sampled = (n, total) => total > n
  ? `${n} of ${total} sampled — ${total - n} not examined, raise with --sample`
  : `all ${total} examined`;

let failures = 0;
const check = (name, pass, detail = '') => {
  if (!pass) failures++;
  console.log(`${pass ? 'pass' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const skip = (name, why) => console.log(`skip  ${name}  — ${why}`);

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
    if (!report.length) skip('blank ledger — rendered', 'page declares no [data-blank] section');
    else check('blank ledger — rendered', naked.length === 0,
      naked.length ? `no blank device in: ${naked.map((r) => r.id).join(', ')}` : `${report.length} sections`);
  }

  /* ── universal: hover changes something ────────────────────────────────────
     The interactive element is found rather than named. `.row` is N3's; a page without
     one still has to answer this question, and "no .row" is not an answer. */
  {
    const targets = page.locator('a[href], button, [role="button"], .row, [data-interactive]');
    const total = await targets.count();
    const n = Math.min(total, SAMPLE);
    if (!n) skip('hover changes something', 'no interactive element on the page');
    else {
      /* A sample, not the first match. Judging one element made the verdict depend on
         document order — the first hit here was a skip link, and "the first anchor has no
         hover style" is not the question gate 0 asks. Gate 0 calls a hover that does
         nothing a slop tell, so every element sampled has to answer for itself. */
      const snap = el => el.evaluate((node) => {
        const c = getComputedStyle(node), a = getComputedStyle(node, '::after');
        /* Read the properties hover is actually spent on. Comparing whole cssText would
           make an unrelated transition mid-flight look like a hover response. */
        return [c.backgroundColor, c.color, c.borderColor, c.textDecorationLine,
          c.transform, c.opacity, a.transform, a.opacity, a.width].join('|');
      });
      const dead = [];
      for (let i = 0; i < n; i++) {
        const el = targets.nth(i);
        if (!(await el.isVisible())) continue;
        await el.scrollIntoViewIfNeeded();
        const cold = await snap(el);
        await el.hover();
        await page.waitForTimeout(320);
        if (await snap(el) === cold) dead.push(await el.evaluate(node =>
          `${node.tagName.toLowerCase()}${node.className ? `.${String(node.className).split(' ')[0]}` : ''}`));
        await page.mouse.move(0, 0);
      }
      check('hover changes something', dead.length === 0,
        dead.length ? `dead on hover: ${dead.join(', ')}` : sampled(n, total));
    }
  }

  /* ── universal: the motion does not reflow what is under it ─────────────────
     §4 names this and nothing asserted it, which left the cheapest way to build a reveal
     — animate height, margin or top — passing the gate. Those properties move every
     element below the animating one, so the page rearranges itself under a reader who is
     already mid-sentence.

     Measured, not declared, and sampled THROUGHOUT the motion rather than at both ends of
     it. Comparing top-of-page before against top-of-page after looks obviously right and
     catches nothing: by the time a baseline is taken, the reveals already in the viewport
     have fired, and by the time the page returns to the top every reveal has finished, so
     both measurements agree. The poisoned fixture passed exactly that way. What a reflow
     actually looks like is a landmark whose document position is not the same number at
     every point during the scroll. */
  {
    /* offsetTop, not getBoundingClientRect: the rect includes the element's transform, so
       measuring it that way flags a translateY reveal — the correct technique, the one
       this check exists to steer people toward — as a reflow. offsetTop is the layout
       position and moves only when the layout actually changes. */
    const landmarks = () => page.evaluate(() => {
      const layoutTop = (el) => {
        let y = 0;
        for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
        return y;
      };
      return {
        height: document.documentElement.scrollHeight,
        tops: [...document.querySelectorAll('section, header, footer, main, article')]
          .map(layoutTop),
      };
    });

    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);

    /* Step rather than jump: a single scrollTo can outrun an IntersectionObserver, and a
       reveal that never fired cannot reflow anything, which would read as a pass. */
    const series = [await landmarks()];
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await page.evaluate(f => scrollTo(0, document.documentElement.scrollHeight * f), i / steps);
      await page.waitForTimeout(240);
      series.push(await landmarks());
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(600);
    series.push(await landmarks());

    const count = Math.min(...series.map(s => s.tops.length));
    let worst = { i: -1, delta: 0 };
    for (let i = 0; i < count; i++) {
      const seen = series.map(s => s.tops[i]);
      const delta = Math.max(...seen) - Math.min(...seen);
      if (delta > worst.delta) worst = { i, delta };
    }
    const heights = series.map(s => s.height);
    const grew = Math.max(...heights) - Math.min(...heights);

    check('motion does not reflow what is under it',
      worst.delta <= 1 && grew <= 1,
      worst.delta > 1 ? `landmark ${worst.i} moved ${worst.delta}px while the motion ran`
        : grew > 1 ? `document height changed by ${grew}px during the motion`
          : `${count} landmark(s) held position across ${series.length} samples`);
  }

  /* ── universal: keyboard focus paints a ring, the mouse does not ────────────
     §4 states both halves. Only the first was ever asserted, so a page that painted the
     ring on every click — the exact thing :focus-visible exists to prevent — passed. */
  {
    const focusable = page.locator('a[href], button, [role="button"], input, select, textarea');
    const total = await focusable.count();
    const n = Math.min(total, SAMPLE);
    if (!n) skip('keyboard focus paints a ring', 'no focusable element');
    else {
      /* Sampled, for the same reason hover is: judging only the first focusable made the
         verdict a property of document order. A page whose skip link kept its ring while
         every button lost one passed both halves of this check. */
      const ring = () => page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return {
          name: `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''}`,
          visible: el.matches(':focus-visible'),
          painted: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
          detail: `${cs.outlineWidth} ${cs.outlineStyle}`,
        };
      });

      const unpainted = [];
      let reached = 0;
      await page.evaluate(() => document.activeElement?.blur());
      for (let i = 0; i < n; i++) {
        await page.keyboard.press('Tab');
        const kbd = await ring();
        if (!kbd) break;
        reached++;
        if (!(kbd.visible && kbd.painted)) unpainted.push(kbd.name);
      }
      check('keyboard focus paints a ring', reached > 0 && unpainted.length === 0,
        !reached ? 'Tab reached nothing'
          : unpainted.length ? `no ring on: ${unpainted.join(', ')}` : sampled(reached, total));

      /* A click that moves focus elsewhere (a link that navigates) leaves nothing to
         judge. Where something is focused, a painted ring is the failure — that is the
         difference between styling :focus and styling :focus-visible. */
      const ringed = [];
      for (let i = 0; i < n; i++) {
        const el = focusable.nth(i);
        if (!(await el.isVisible())) continue;
        await el.scrollIntoViewIfNeeded();
        await el.click();
        const mouse = await ring();
        if (mouse?.painted) ringed.push(`${mouse.name} (${mouse.detail})`);
      }
      check('a mouse click paints no ring', ringed.length === 0,
        ringed.length ? `ring after click: ${ringed.join(', ')}` : sampled(n, total));
    }
  }

  /* The button responds to the press itself, not to the release. */
  if (!(await page.locator('.btn').count())) skip('button responds on press', 'no .btn on the page');
  else {
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
  if (!(await page.locator('#chain').count())) skip('scroll fills the blanks', 'no #chain section');
  else {
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
  if (!(await page.locator('#chain .sentence').count())) skip('scroll lights the sentence', 'no #chain .sentence');
  else {
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
  if (!(await page.locator('.cycle__tail').count())) {
    skip('the output word cycles', 'no .cycle__tail on the page');
  } else {
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
    driven: document.querySelectorAll('.blank[data-driven="true"]').length,
    unfilled: document.querySelectorAll('.blank[data-driven="true"]:not([data-filled="true"])').length,
    words: document.querySelectorAll('.cycle__word').length,
    shown: [...document.querySelectorAll('.cycle__word')].filter((el) => el.getClientRects().length).length,
  }));

  /* universal — §4's "removes the motion while the state changes survive" */
  check('reduced motion: transitions suppressed', r.slowest <= 0.05, `${r.slowest}s`);
  check('reduced motion: nothing left invisible', r.hidden === 0, `${r.hidden} hidden`);

  /* brand */
  if (!r.driven) skip('reduced motion: blanks are already filled', 'no scroll-driven blank');
  else check('reduced motion: blanks are already filled', r.unfilled === 0, `${r.unfilled} unfilled`);
  if (!r.words) skip('reduced motion: one output word, statically', 'no .cycle__word');
  else check('reduced motion: one output word, statically', r.shown === 1, `${r.shown} of ${r.words} visible`);

  await ctx.close();
}

await browser.close();
console.log(`\n${failures ? `${failures} FAILURE(S)` : 'all interaction checks passed'}`);
process.exit(failures ? 1 : 0);
