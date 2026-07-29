/* preflight.mjs — one answer to "is this checkout able to run the gates?"

   Three questions per dependency, in this order, because answering them out of order is
   how a setup step becomes a re-download:
     1. present?   — never fetch what is already here
     2. loads?     — a directory on disk is not proof; the thing has to resolve, launch,
                     or be found by the font system. Half-installed dependencies report
                     present and fail at the gate that needs them.
     3. missing    — only then, and only that one, is fetched (--fix)

   `brands/example` is deliberately outside every fetch decision. It is the in-repo
   template, not a brand someone is shipping: nothing may be downloaded on its behalf,
   so its Typst proof compiles with whatever faces the system already has.

   Usage: node scripts/preflight.mjs [--fix]                                            */

import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { homedir, platform } from 'node:os';

const FIX = process.argv.includes('--fix');
/* A runner is not a workstation. Checks about what a person has installed are suppressed
   there rather than failed, so CI stays a statement about the repo. */
const CI = !!process.env.CI || process.argv.includes('--ci');
const root = resolve(import.meta.dirname, '..');

/* The template. Excluded from font resolution and from every fetch this script performs. */
const TEMPLATE_BRAND = 'example';

/* Every brand except the template — the set whose needs are real requirements. */
const shippingBrands = () => {
  const dir = join(root, 'brands');
  return existsSync(dir)
    ? readdirSync(dir)
      .filter(b => statSync(join(dir, b)).isDirectory())
      .filter(b => b !== TEMPLATE_BRAND)
    : [];
};

const rows = [];
let required = 0;
const report = (state, name, detail = '') => {
  rows.push({ state, name, detail });
  const mark = { ok: '✓', warn: '~', bad: '✗' }[state];
  console.log(`  ${mark} ${name.padEnd(26)} ${detail}`);
  if (state === 'bad') required++;
};

const sh = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
};
const has = cmd => sh(process.platform === 'win32' ? 'where' : 'which', [cmd]).ok;

/* ---------------------------------------------------------------- runtime */

console.log('\nruntime');
{
  const major = Number(process.versions.node.split('.')[0]);
  major >= 20
    ? report('ok', 'node', `v${process.versions.node}`)
    : report('bad', 'node', `v${process.versions.node} — needs 20+`);
}

/* ------------------------------------------------------------ npm packages
   node_modules existing says nothing: npm 12 blocks postinstall scripts unless they are
   allowlisted, and style-dictionary patches itself in one. So this resolves and imports
   each declared dependency rather than trusting the directory. */

console.log('\nnpm packages');
{
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  if (!existsSync(join(root, 'node_modules'))) {
    report('bad', 'node_modules', FIX ? 'installing…' : 'absent — run `npm ci`');
    if (FIX) {
      const r = sh('npm', ['ci']);
      report(r.ok ? 'ok' : 'bad', 'npm ci', r.ok ? 'installed' : 'failed');
    }
  }
  for (const dep of declared) {
    if (!existsSync(join(root, 'node_modules', dep))) {
      report('bad', dep, 'not installed — `npm ci`');
      continue;
    }
    try {
      await import(dep);
      /* Read the manifest off disk rather than require()-ing it: a package with an
         `exports` map (style-dictionary has one) refuses the './package.json' subpath,
         and a version lookup failing would have reported a loadable package as broken. */
      const meta = JSON.parse(readFileSync(join(root, 'node_modules', dep, 'package.json'), 'utf8'));
      report('ok', dep, meta.version);
    } catch (e) {
      report('bad', dep, `installed but will not load — ${String(e.message).split('\n')[0]}`);
    }
  }
}

/* --------------------------------------------------------- external tools */

console.log('\nexternal tools');
{
  /* typst is required by the print medium and by nothing else, so the requirement follows
     the brands on disk: paper shipping somewhere makes a missing binary a hard failure,
     and a checkout holding only the template does not need a typesetter installed to be
     in working order. */
  const printBrands = shippingBrands().filter(b =>
    existsSync(join(root, 'brands', b, 'print')));
  if (has('typst')) {
    const v = sh('typst', ['--version']);
    report(v.ok ? 'ok' : 'bad', 'typst', v.ok ? v.out : 'on PATH but will not run');
  } else if (FIX && has('mise')) {
    const r = sh('mise', ['use', '-g', 'typst@latest']);
    report(r.ok ? 'ok' : 'bad', 'typst', r.ok ? 'installed via mise' : 'mise install failed');
  } else if (!printBrands.length) {
    report('warn', 'typst', 'absent — no shipping brand uses print yet, so not required');
  } else {
    const line = { darwin: 'brew install typst', win32: 'winget install Typst.Typst' }[platform()]
      ?? 'mise use -g typst@latest  (or your distro package)';
    report('bad', 'typst', `absent — ${printBrands.join(', ')} ship print; ${line}`);
  }

  /* Gates 3 and 4 drive a real browser. playwright the package resolving is not the same
     as the browser binary being downloaded — they fail in different places, months apart. */
  try {
    const { chromium } = await import('playwright');
    const bin = chromium.executablePath();
    if (existsSync(bin)) {
      report('ok', 'playwright chromium', bin.replace(homedir(), '~'));
    } else if (FIX) {
      const r = sh('npx', ['--yes', 'playwright', 'install', 'chromium']);
      report(r.ok ? 'ok' : 'bad', 'playwright chromium',
        r.ok ? 'downloaded' : 'download failed');
    } else {
      report('bad', 'playwright chromium', 'browser not downloaded — `npx playwright install chromium`');
    }
  } catch {
    report('bad', 'playwright chromium', 'playwright package missing');
  }
}

/* ------------------------------------------------------------------ fonts
   The type pool is toolchain, at the same layer as typst, and it is required whether or
   not a brand of your own exists yet. Scoping it to shipping brands was wrong in the way
   that is expensive to notice: typst exits 0 with no faces installed, substituting
   silently, so a checkout with only the template compiled a proof that reported success
   and typeset in the wrong faces. A missing pool is therefore fetched on sight rather
   than waiting for --fix — fonts.sh is idempotent and skips what is already there, so the
   thing --fix guards against (a re-download) cannot happen here.

   The template exclusion survives, narrowed to what it was always about: assets belonging
   to one brand. `example` no longer buys an exemption from the house type library. */

console.log('\nfonts');
{
  const brandsDir = join(root, 'brands');
  const brands = existsSync(brandsDir)
    ? readdirSync(brandsDir).filter(b => statSync(join(brandsDir, b)).isDirectory())
    : [];

  const wanted = new Set();
  for (const brand of brands) {
    const f = join(brandsDir, brand, 'tokens', 'primitive', 'font.json');
    if (!existsSync(f)) continue;
    const stacks = JSON.parse(readFileSync(f, 'utf8')).font ?? {};
    for (const entry of Object.values(stacks)) {
      const value = entry?.$value ?? entry?.value;
      /* Only the first face in a stack is the brand's own; the rest are system fallbacks
         by construction, and demanding `sans-serif` be installed is nonsense. */
      if (Array.isArray(value) && value[0]) wanted.add(value[0]);
      else if (typeof value === 'string') wanted.add(value);
    }
  }

  if (!wanted.size) {
    report('ok', 'type pool', 'no brand declares a face');
  } else if (!has('fc-list')) {
    report('warn', 'type pool', 'fontconfig absent — cannot verify; install manually if a face is missing');
  } else {
    const resolves = () => {
      const installed = sh('fc-list', [':', 'family']).out.toLowerCase();
      return [...wanted].filter(f => !installed.includes(f.toLowerCase()));
    };
    const absent = resolves();
    if (!absent.length) report('ok', 'type pool', `${wanted.size} declared face(s) resolve`);
    else if (platform() === 'win32') {
      report('bad', 'type pool', `missing: ${absent.join(', ')} — \`npm run fetch:fonts && npm run install:fonts\``);
    } else {
      console.log(`  … fetching ${absent.length} missing face(s): ${absent.join(', ')}`);
      const r = sh('bash', [join(root, 'scripts', 'fonts.sh')]);
      const still = resolves();
      report(still.length ? 'bad' : 'ok', 'type pool',
        still.length ? `still missing after fetch: ${still.join(', ')}` : `fetched; ${wanted.size} face(s) resolve`);
      if (still.length) console.log(`      ${r.out.split('\n').filter(Boolean).slice(-1)[0] ?? ''}`);
    }
  }
}

/* ----------------------------------------------------------------- skills
   check-skills.mjs owns "is it installed". What it cannot see is the same skill existing
   as a real directory in two roots at once: agents then resolve whichever their own
   convention reaches first, and the two copies drift apart silently. */

console.log('\nskills');
{
  /* process.execPath, not 'node': resolving through PATH made a runner without node on
     PATH produce an empty report, and an empty report matched no success line — so a
     perfectly consistent catalog was reported as broken. Absence of evidence was being
     read as evidence, which is the failure mode this whole suite exists to prevent. */
  const r = sh(process.execPath, [join(root, 'scripts', 'check-skills.mjs')]);
  const missingRequired = /(\d+) REQUIRED skill\(s\) missing/.exec(r.out);
  const ran = /catalog: \d+ authors/.test(r.out);
  const invariant = ran && /✓ catalog invariant holds/.test(r.out);
  /* The invariant is a property of catalog/authors.json, so it is checked everywhere.
     What is installed is a property of a workstation, and a CI runner does not have one —
     asking it there produces a red build about a machine nobody works on. */
  report(invariant ? 'ok' : 'bad', 'catalog invariant',
    invariant ? 'all declared taste, none contradicted'
      : ran ? 'catalog/authors.json is inconsistent'
        : `check-skills.mjs did not run — ${r.out.split('\n')[0] || 'no output'}`);

  if (CI) {
    report('warn', 'installed skills', 'not judged on CI — a runner has no workstation');
  } else if (missingRequired) {
    const sources = [...r.out.matchAll(/npx skills add (\S+)/g)].map(m => m[1]);
    if (FIX) {
      for (const src of [...new Set(sources)]) {
        const i = sh('npx', ['--yes', 'skills', 'add', src, '-g', '-y']);
        report(i.ok ? 'ok' : 'bad', 'skills add', `${src} ${i.ok ? 'installed' : 'failed'}`);
      }
    } else {
      report('bad', 'required skills', `${missingRequired[1]} missing — ${sources.join(' ')}`);
    }
  } else report('ok', 'required skills', 'all present');

  /* Duplicate detection across the roots check-skills reads. A symlink into the canonical
     store is the healthy shape; two real directories with one name is the failure. */
  const roots = CI ? [] : [
    join(homedir(), '.agents', 'skills'),
    join(homedir(), '.claude', 'skills'),
    join(homedir(), '.codex', 'skills'),
    join(homedir(), '.config', 'agents', 'skills'),
    join(process.cwd(), '.claude', 'skills'),
  ].filter(existsSync);
  const seen = new Map();
  for (const dir of roots) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      /* lstat, not stat: stat follows the symlink and reports the canonical directory,
         which would make every healthy Claude Code link look like a second real copy. */
      const st = lstatSync(p, { throwIfNoEntry: false });
      if (st?.isDirectory()) seen.set(name, [...(seen.get(name) ?? []), dir.replace(homedir(), '~')]);
    }
  }
  const dupes = [...seen].filter(([, dirs]) => dirs.length > 1);
  if (CI) { /* nothing to deduplicate on a machine with no skill roots */ }
  else if (dupes.length)
    report('bad', 'skill duplicates', dupes.map(([n, d]) => `${n} (${d.join(' + ')})`).join('; '));
  else report('ok', 'skill duplicates', 'none — one canonical copy per skill');
}

console.log(required
  ? `\n${required} blocking item(s). Re-run with --fix to install only what is missing.`
  : '\nready — every dependency present and loading.');
process.exit(required ? 1 : 0);
