/* Gate 3 — render-verify. Screenshots a page at real target dimensions.
   Usage: node scripts/shoot.mjs <file> [outDir] [width] [height]        */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';

const [file, outDir = null, w = '1440', h = '1200'] = process.argv.slice(2);
if (!file) {
  console.error('usage: node scripts/shoot.mjs <file> [outDir] [width] [height]');
  process.exit(2);
}

const path = resolve(file);
const out = resolve(outDir ?? join(dirname(path), '_shots'));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
});
await page.goto('file:///' + path.replace(/\\/g, '/'));
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

const name = basename(path).replace(/\.html$/, '');
await page.screenshot({ path: join(out, `${name}-full.png`), fullPage: true });
await page.screenshot({ path: join(out, `${name}-top.png`) });
await browser.close();
console.log(`shot ${name} -> ${out}`);
