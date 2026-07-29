/* Gate 2 — accessibility. axe-core against the RENDERED surface.

   ENGINE §4 gate 2 is specific about which half matters: "contrast verified against the
   actual rendered surface, not the intended one". A token pair that clears 4.5:1 in
   check-drift is a claim about two values; what a reader sees is those values after
   inheritance, opacity, overlap and whatever the browser actually painted. Gate 0b judges
   the vocabulary, this judges the page — and they disagree exactly when it matters.

   Every violation fails. Gates are a floor (WORKFLOW.md), so there is no severity
   threshold to argue about: axe reporting a serious contrast failure and a "minor" one
   both mean a person hits it.

   Usage: node scripts/check-a11y.mjs <file|url> [--medium desktop|mobile] [--rules a,b]  */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

/* Same targets as gate 3, for the same reason: a surface can pass at 1440 and fail at 375
   where the type reflows onto a busier ground. */
const MEDIA = {
  desktop: { width: 1440, height: 1200 },
  mobile: { width: 375, height: 812 },
};

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};
const positional = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
const target = positional[0];
if (!target) {
  console.error('usage: node scripts/check-a11y.mjs <file|url> [--medium desktop|mobile] [--rules a,b]');
  process.exit(2);
}

const mediumArg = flag('medium') ?? 'all';
const targets = mediumArg === 'all' ? Object.entries(MEDIA)
  : MEDIA[mediumArg] ? [[mediumArg, MEDIA[mediumArg]]] : null;
if (!targets) {
  console.error(`unknown medium "${mediumArg}" — one of: ${Object.keys(MEDIA).join(', ')}, all`);
  process.exit(2);
}
const only = flag('rules')?.split(',').map(s => s.trim()).filter(Boolean) ?? null;

const url = /^https?:|^file:/.test(target) ? target : 'file://' + resolve(target);
const browser = await chromium.launch();
let failures = 0;

for (const [medium, size] of targets) {
  /* An explicit context, because AxeBuilder rejects a page made by browser.newPage() —
     it needs the context to inject axe into every frame. */
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  /* Fonts first: contrast is measured on painted pixels, and a fallback face can carry a
     different weight, which changes whether axe treats the text as large. */
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  let builder = new AxeBuilder({ page });
  if (only) builder = builder.withRules(only);
  const { violations, passes, incomplete } = await builder.analyze();

  console.log(`\n${medium}  ${size.width}×${size.height}`);
  if (!violations.length) {
    console.log(`  pass  no violations  — ${passes.length} rule(s) passed`);
  } else {
    for (const v of violations) {
      failures++;
      console.log(`  FAIL  ${v.id}  [${v.impact}]  — ${v.help}`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`          ${node.target.join(' ')}`);
        /* axe's own words for what is wrong, which for contrast carry the measured ratio —
           the number a person needs in order to fix it, not just the rule name. */
        const why = [...node.any, ...node.all].map(c => c.message).join('; ');
        if (why) console.log(`          ${why}`);
      }
      if (v.nodes.length > 3) console.log(`          …and ${v.nodes.length - 3} more node(s)`);
    }
  }

  /* Reported, never counted. "incomplete" is axe saying it could not decide — a background
     image behind text, most often — and silence about it would let the one case a machine
     cannot judge leave no trace at all. */
  if (incomplete.length) {
    console.log(`  note  ${incomplete.length} check(s) axe could not decide: ` +
      `${incomplete.map(i => i.id).join(', ')} — judge these yourself`);
  }

  await ctx.close();
}

await browser.close();
console.log(`\n${failures ? `${failures} VIOLATION(S)` : 'accessibility: no violations'}`);
process.exit(failures ? 1 : 0);
