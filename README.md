# _design-system

House design system for `D:\01.Coding`. **Values live in DTCG token JSON; character
lives in `DESIGN.md`.** Every visual deliverable — web/app screens, slides, card news,
print — resolves to one brand's token set.

Status: **building**. Brands: `classhift` (S4, tokens not yet consumed) and `chunaimun`
(S4 — landing built and gated; its four layer-2 pages are still the revoked surface).
`chunaimun` is the reference implementation of the medium fork (ENGINE §2.1) and of the
web/print **split thesis**: one brand, one layer-1 contract, two arguments — the web
claims a chain, the printed interior claims a page you write on.

## Layout

```
_design-system/
├── README.md                  # this file — entry decision + stage map
├── ENGINE.md                  # brand-agnostic rules: layer scope, media, gates, motion
├── package.json               # Style Dictionary build (deps installed at S3)
├── brands/
│   └── <brand>/
│       ├── DESIGN.md          # brand character, 9 sections (Google DESIGN.md format)
│       ├── tokens/
│       │   ├── primitive/     # raw values — blue.500 = #2563EB
│       │   ├── semantic/      # roles — action = {blue.500}
│       │   └── component/     # per-component exceptions — button.bg = {action}
│       └── dist/              # GENERATED — tokens.css, tokens.typ. Never hand-edit.
└── auditions/<brand>/         # S1 direction candidates (HTML + PNG), kept as evidence
```

Each token layer references **only the layer directly below it**. That single rule is
what keeps a theme swap from turning into a find-and-replace across hundreds of files.

## Brand assignment

**One brand per project, fixed.** A project does not pick a theme per task — the
brand is assigned once and does not move. Picking from a gallery per job is what
killed the previous system.

| Project | Brand | Status |
|---|---|---|
| classhift-website | `classhift` | S4 — tokens live, not yet consumed by the site |
| 천AI문 ebook + sales site | `chunaimun` | **S4.** Direction **N3 「연쇄」** locked 2026-07-28 (`approval_260728_04_s2-lock-n3.md`). Landing built from tokens in `02_Claude/chunaimun-site`; **the four layer-2 pages are still the revoked surface.** Entry brief for the next session: `.scratch/chunaimun/docs/plan/plan_260728_02_handoff.md`. Sub-brand of Classhift in business terms, **independent at layer 1**. |

## Stages

`S0` research → `S1` diverge (4–6 rendered directions) → `S2` compare & lock →
`S3` tokenize → `S4` produce → `S5` refine.

- **S1–S3 run once per brand.** S4–S5 are the everyday loop.
- **S5 → S3 return rule:** if refinement needs something outside the tokens, go back
  to S3 and change the token. Never override locally in one file. This is the single
  point where the system lives or dies.

## Entry decision — not every job starts at S0

```
throwaway one-off?            → outside the system, tokens as reference only
brand not established yet?    → S0, full path
editing an existing artifact? → S5 only
solvable inside current tokens? → S4
not solvable inside them?     → S3 (extend tokens), then S4
```

**Ask before entering any stage.** Even when the decision says "S0", confirm the full
path is wanted before walking it. Auto-escalating turns a small request into a project.

## Build

```bash
npm run build:tokens        # tokens/ -> dist/tokens.css + dist/tokens.typ
npm run verify:classhift    # build -> hardcode gate -> render
npm run verify:chunaimun    # same, for chunaimun specimen
```

`dist/` is generated output. Edit `tokens/`, rebuild, never touch `dist/`.

## Checks

| Script | Gate | What it refuses |
|---|---|---|
| `scripts/check-tokens.mjs <brand> <file…>` | 1 | a literal colour or px, or a `var(--ds-*)` the token set does not define |
| **`scripts/check-drift.mjs <brand> [file…]`** | **0b** | see below |
| `auditions/<brand>/_drive.mjs [prefix]` | 0/2/3/4 | drives a board instead of photographing it — scroll, hover, focus, reduced motion, contrast, Korean type |

**`check-drift.mjs` is the one worth understanding.** Gates 0–4 ask, one artefact at a
time, *is this the model's distributional default?* — necessary, but reactive. This one
asks a narrower question: **can the brand's vocabulary even express the default?** It
fails a brand whose tokens can say blur, gradient, shadow or glass; whose colours land in
the cream/sand OKLCH band or are named `paper`/`bone`/`cream`; whose text roles miss AA
against their own ground; or which has no hover/press/focus. Given surface files it also
runs the **blank ledger** — a brand-declared marker that every section still carries the
brand's signature device.

Written after four `chunaimun` audition boards passed every existing gate and three of
them still needed correcting. **Any rule of this shape must be verified in both
directions** — the first cream-band test missed the exact colour it was written for.
