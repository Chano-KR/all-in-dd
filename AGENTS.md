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
| `WORKFLOW.md` | how work proceeds — the S0–S5 stage machine, what kind of tool loads at each stage, where each gate runs |
| `brands/<brand>/DESIGN.md` | what this brand argues — claim, signature device, voice |

Precedence: explicit user instruction → the brand's `DESIGN.md` → `ENGINE.md` →
`WORKFLOW.md` → whatever your harness's own defaults say.

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

## Skills

`WORKFLOW.md` names a **kind** of tool per stage rather than any harness's skill
names. Map the four kinds onto whatever your setup has:

| Kind | Belongs to | Examples of the shape |
|---|---|---|
| taste — imposes a look | **S1 only**, one per direction | a skill that has opinions about type, palette, composition |
| craft — imposes technique | S4, S5 | motion physics, component detail, a11y behavior; style-neutral |
| audit — judges, doesn't author | S2, S5 | interface critique, adversarial grilling, diff review |
| make — produces artifacts | wherever the stage calls | image generation, prototypes, identity boards, chart systems |

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
