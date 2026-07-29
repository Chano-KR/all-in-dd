# AGENTS.md

Instructions for coding agents working inside an all-in-dd checkout. `CLAUDE.md`
points here; this file is the single source.

## What this repo is

A design-system skeleton: one DTCG token source per brand, built to CSS (web,
slides, card news) and Typst (print), with executable gates that catch the
statistical-default look models produce.

Three documents, three jobs — read the one your task is in:

| File | Answers |
|---|---|
| `ENGINE.md` | what is true of the values — layers, media, styling per genre, the canvas layer, gates, motion, Korean text |
| `WORKFLOW.md` | how work proceeds — the S0–S5 stage machine, what loads at each stage, where each gate runs |
| `SKILLS.md` | which skills each stage needs, what they do, how to install them |
| `brands/<brand>/DESIGN.md` | what this brand argues — claim, signature device, voice |

Precedence: explicit user instruction → the brand's `DESIGN.md` → `ENGINE.md` →
`WORKFLOW.md` → whatever your harness's own defaults say.

## Hard rules

- **Never edit `dist/`.** It is generated. Change `tokens/` and rebuild.
- **Gate 0 is a craft check, not a blacklist.** No visual language is banned. Glass,
  gradients, dark mode and sourced photography are all legitimate; what fails is a
  default arriving where a decision should have been made. See ENGINE §4.
- **No literals in surface code.** Colors and dimensions come from `var(--ds-*)`
  (web) or `ds.*` (Typst). A hex or px in source is a gate-1 failure, and so is a
  Tailwind arbitrary value (`w-[347px]`).
- **State tokens before components.** hover/press/focus must exist in
  `tokens/semantic/` before any component references them.
- **Motion choreography is prose** in DESIGN.md. Only duration and easing are
  tokens (ENGINE §3).
- **Korean text**: `word-break: keep-all`, Hangul-first leading floors, and every
  font stack names a matched Korean face (ENGINE §5).
- **Styling default follows the web genre** (ENGINE §2.2): tool-type UIs
  (dashboards, admin, forms) get Tailwind; content and expressive surfaces
  (blogs, docs, portfolios, one-pagers) get **scoped CSS + token variables** —
  CSS Modules in React, `<style>` blocks in Svelte/Astro, `<style scoped>` in
  Vue. The contract is the shape, not the file format.
- **A canvas tool is part of the loop, not a detour** (ENGINE §2.4): boards at
  S1, token combinations at S3, layout-to-code at S4. Tokens flow one way —
  DTCG → build → canvas. A canvas-side variable edit is a proposal; apply it by
  editing the token source. Never write back.

## Commands

```
npm run preflight        # deps present? do they load? --fix installs only what is missing
npm run build:tokens     # DTCG JSON -> dist/tokens.css + dist/tokens.typ, all brands
npm run check:tokens     # staleness gate: fails if dist doesn't match source
npm run gate:tokens      # hardcode / unknown-token scan   (args: <brand> <file...>)
npm run gate:drift       # vocabulary-level default check
npm run gate:interactions # drives the page: hover, focus, reduced motion  (args: [baseUrl])
npm run shoot            # gate 3 capture  (args: <file> --medium slides|cards|mobile|desktop|all)
npm run print:example    # proves the print pipeline end to end
npm run fetch:fonts      # Windows; macOS/Linux: bash scripts/fonts.sh
npm run install:fonts    # Windows; macOS/Linux: bash scripts/fonts.sh
npm run check:skills     # which workflow skills are installed, and how to get the rest
npm test                 # poisoned fixtures for the gates — run after touching any gate rule
```

Run `check:tokens` before compiling any Typst document. A gate failure returns
the work; it is not waived.

`preflight` answers present → loads → missing, in that order, and fetches only
the last. The type pool is toolchain, at the same layer as typst: a missing face
is fetched on sight rather than waiting for `--fix`, because typst exits 0 with
no faces installed and substitutes silently — a proof that reports success in the
wrong faces is worse than one that fails. `fonts.sh` skips what is already on
disk, so fetching on sight cannot become re-downloading.

`brands/example` is excluded from *per-brand* assets, not from the house type
library. It is the template: nothing brand-specific is downloaded on its behalf.

## Skills

**Check before starting any visual stage:**

```bash
npm run check:skills          # what is installed, and the install line for what isn't
npm run check:skills --strict # exit 1 if a REQUIRED skill is missing
npm run skills -- --stage S1 "<brief>"   # which of the ~130 installed ones fit this work
```

Most of the pool is set to `"name-only"`, so its descriptions are not in context. That is
a context-budget decision, not a lock: every one of them is still invokable by name. The
recommender is where the descriptions live now.

`SKILLS.md` is the manifest — every skill by name, what it does, which stage
needs it, and its install source. The short version:

```bash
npx skills add Leonxlnx/taste-skill    # S1 authors, imagegen, image-to-code
npx skills add emilkowalski/skills     # S4/S5 craft + motion
npx skills add https://github.com/pbakaus/impeccable --skill impeccable
npx skills add mattpocock/skills       # prototype, grill-me  (recommended)
```

If a skill is missing, **say so and name what is lost** — do not silently
continue as if the stage ran complete.

Skills sort into four kinds, and the kind decides where it may run:

| Kind | Belongs to | Examples |
|---|---|---|
| taste — imposes a look | **S1 only**, one per direction | the core five, plus ~30 in the author pool (SKILLS.md) |
| craft — imposes technique | S4, S5 | `apple-design`, `emil-design-eng`, plus the technique pool |
| audit — judges, doesn't author | S2, S5 | `impeccable` |
| make — produces artifacts | wherever the stage calls | `imagegen-frontend-web`, `image-to-code`, `brandkit`, `prototype` |

Two rules that are not preferences:

- **One taste skill per direction at S1, never the same one twice.** Directions
  authored by one voice converge however different their briefs claim to be.
- **Taste skills are barred at S4** on layer-1+2 surfaces. The look is locked; a
  taste skill there is a second authority arguing with the tokens. If production
  feels like it needs one, the tokens are underspecified — extend the tokens.
  (Layer-3 expressive surfaces get one declared exception; see WORKFLOW.md.)

Required means loaded, not obeyed. Depart from a skill where the brand demands
it, and write down the departure and why.

## Starting a brand

Copy `brands/example`, then work in this order: primitives (author color in
`oklch()`; the build owns print conversion) → semantic roles including states →
DESIGN.md claim and signature device → build. The README's "Starting a brand"
section has the same steps with more context.
