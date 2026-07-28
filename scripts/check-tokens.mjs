/* Gate 1 — hardcode + unknown-token check.
   Fails on: a literal colour or px value in the file's own CSS, or a
   var(--ds-*) reference that the built token set does not define.
   Usage: node scripts/check-tokens.mjs <brand> <file...>            */

import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const [brand, ...files] = process.argv.slice(2);
if (!brand || files.length === 0) {
  console.error('usage: node scripts/check-tokens.mjs <brand> <file...>');
  process.exit(2);
}

const root = resolve(import.meta.dirname, '..');
const css = readFileSync(resolve(root, `brands/${brand}/dist/tokens.css`), 'utf8');
const defined = new Set([...css.matchAll(/--ds-[\w-]+/g)].map(m => m[0]));

/* Media queries cannot read custom properties — a breakpoint has to be written as a literal.
   So px is allowed inside a @media prelude, but ONLY at a value the brand declares as a
   breakpoint token. That keeps the escape hatch from becoming a general one. */
const breakpoints = new Set(
  [...css.matchAll(/--ds-[\w-]*breakpoint[\w-]*:\s*([\d.]+px)/g)].map(m => m[1]),
);

const LITERAL = [
  { re: /#[0-9a-fA-F]{3,8}\b/g, what: 'literal colour' },
  { re: /(?<![\w-])\d*\.?\d+px\b/g, what: 'literal px' },
  { re: /\brgba?\([^)]*\)/g, what: 'literal rgb()' },
];

let failures = 0;

for (const f of files) {
  const path = resolve(root, f);
  const src = readFileSync(path, 'utf8');

  /* Only CSS is checked for literals. An .html file's prose is not CSS — scanning it flags
     things like the catalogue number #0207 as a colour. So for HTML we take <style> blocks
     and style="" attributes; for anything else the whole file is CSS.
     Line numbers are preserved by blanking the non-CSS lines rather than dropping them. */
  const isHtml = /\.html?$/i.test(path);
  let lines;
  if (isHtml) {
    const all = src.split('\n');
    const css = new Array(all.length).fill('');
    let inStyle = false;
    all.forEach((line, i) => {
      if (/<style[\s>]/.test(line)) inStyle = true;
      if (inStyle) css[i] = line;
      if (/<\/style>/.test(line)) inStyle = false;
      if (!inStyle && /style\s*=\s*"/.test(line)) {
        css[i] = [...line.matchAll(/style\s*=\s*"([^"]*)"/g)].map(m => m[1]).join(';');
      }
    });
    lines = css;
  } else {
    lines = src.split('\n');
  }

  /* Blank out /* … *​/ block comments before scanning. Prose about the design legitimately
     mentions values ("left ~350px of dead space"), and a comment is not a declaration.
     Newlines are preserved so reported line numbers stay true. */
  lines = lines
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n');

  /* var(--ds-*) references are checked everywhere, CSS or not — an undefined token is a
     defect wherever it is written. */
  const allLines = src.split('\n');

  const report = (line, what, text) =>
    (failures++, console.log(`  ${relative(root, path)}:${line}  ${what}  ${text.trim()}`));

  lines.forEach((line, i) => {
    if (line.trim().startsWith('/*') || line.trim().startsWith('*')) return;
    const isMedia = line.trim().startsWith('@media');
    for (const { re, what } of LITERAL) {
      for (const m of line.matchAll(re)) {
        if (isMedia && what === 'literal px' && breakpoints.has(m[0])) continue;
        if (isMedia && what === 'literal px') {
          report(i + 1, 'undeclared breakpoint', `${m[0]} — add it to tokens as a breakpoint`);
          continue;
        }
        report(i + 1, what, m[0]);
      }
    }
  });

  allLines.forEach((line, i) => {
    for (const m of line.matchAll(/var\((--ds-[\w-]+)/g)) {
      if (!defined.has(m[1])) report(i + 1, 'undefined token', m[1]);
    }
  });
}

if (failures) {
  console.log(`\ngate failed — ${failures} finding(s).`);
  console.log('A literal means the value is not in the system. Fix it at S3 (add the token), not here.');
  process.exit(1);
}
console.log('gate passed — no literals, all token references resolve.');
