// Playwright is borrowed from a sibling project until S3 wires this repo's own deps.
const { chromium } = await import(process.env.PW_ENTRY ?? 'playwright');
import { readdirSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dir = resolve(import.meta.dirname);
const out = join(dir, '_shots');
mkdirSync(out, { recursive: true });

const only = process.argv[2];
const files = readdirSync(dir)
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .filter(f => !only || f.startsWith(only));
const browser = await chromium.launch();

for (const f of files) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto('file:///' + join(dir, f).replace(/\\/g, '/'));
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const name = f.replace('.html', '');
  await page.screenshot({ path: join(out, `${name}-full.png`), fullPage: true });
  await page.screenshot({ path: join(out, `${name}-top.png`) });
  console.log('shot', name);
  await page.close();
}
await browser.close();
