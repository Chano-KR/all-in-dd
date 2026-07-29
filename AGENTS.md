# AGENTS.md

Instructions for coding agents working inside an all-in-dd checkout. `CLAUDE.md`
points here; this file is the single source.

## What this repo is

A design-system skeleton: one DTCG token source per brand, built to CSS (web,
slides, card news) and Typst (print), with executable gates that catch the
statistical-default look models produce. Rules live in `ENGINE.md` — read it
before touching anything visual. Brand character lives in `brands/<brand>/DESIGN.md`.

Precedence: explicit user instruction → the brand's `DESIGN.md` → `ENGINE.md` →
whatever your harness's skill defaults say.

## Hard rules

- **Never edit `dist/`.** It is generated. Change `tokens/` and rebuild.
- **No literals in surface code.** Colors and dimensions come from `var(--ds-*)`
  (web) or `ds.*` (Typst). A hex or px in source is a gate-1 failure, and so is a
  Tailwind arbitrary value (`w-[347px]`).
- **State tokens before components.** hover/press/focus must exist in
  `tokens/semantic/` before any component references them.
- **Motion choreography is prose** in DESIGN.md. Only duration and easing are
  tokens (ENGINE §3).
- **Korean text**: `word-break: keep-all`, Hangul-first leading floors, and every
  font stack names a matched Korean face (ENGINE §5).
- Media/styling defaults per web genre are in ENGINE §2.2 — tool-type UIs default
  to Tailwind, content/expressive surfaces to scoped CSS + token variables.

## Commands

```
npm run build:tokens     # DTCG JSON -> dist/tokens.css + dist/tokens.typ, all brands
npm run check:tokens     # staleness gate: fails if dist doesn't match source
npm run gate:tokens      # hardcode / unknown-token scan   (args: <brand> <file...>)
npm run gate:drift       # vocabulary-level default check
npm run print:example    # proves the print pipeline end to end
npm run fetch:fonts      # Windows; macOS/Linux: bash scripts/fonts.sh
npm run install:fonts    # Windows; macOS/Linux: bash scripts/fonts.sh
```

Run `check:tokens` before compiling any Typst document. A gate failure returns
the work; it is not waived.

## Skills, if your harness has them

The stage machine (research → diverge → lock → tokenize → produce → refine) is a
process concern and travels with the agent harness, not this repo. The useful
skill shape, whatever the exact names in your setup:

- **Taste skills** (ones that impose a look) belong to divergence only — one per
  direction, never during production against locked tokens.
- **Craft skills** (motion physics, component detail — style-neutral) belong to
  production and refinement.
- **Audit skills** (critique without authoring) belong to comparison and refinement.

If production feels like it needs a taste skill, the tokens are underspecified —
go back and extend the tokens instead.

## Starting a brand

Copy `brands/example`, then work in this order: primitives (author color in
`oklch()`; the build owns print conversion) → semantic roles including states →
DESIGN.md claim and signature device → build. The README's "Starting a brand"
section has the same steps with more context.
