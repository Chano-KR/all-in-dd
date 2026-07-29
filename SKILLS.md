# SKILLS — what to install, and what each one is for

`WORKFLOW.md` says which stage loads what. This file names the actual skills, where
they come from, and how to install them.

Run the check first — it tells you what is already there and prints the install line
for whatever is missing:

```bash
npm run check:skills
```

Skills install with the [`skills`](https://github.com/vercel-labs/skills) CLI, which
writes to `~/.agents/skills` and links it into every agent CLI it detects (Claude Code,
Codex, Cursor, Amp, Antigravity, and others):

```bash
npx skills add <source>
```

Every source below is the author's own repository — install from there rather than
from a mirror, so updates and fixes reach you:

| Source | Maintainer | Covers |
|---|---|---|
| [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | nextlevelbuilder | S0 genre presets and anti-pattern data |
| [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) | Leon | the S1 authors, imagegen, image-to-code, brandkit |
| [`emilkowalski/skills`](https://github.com/emilkowalski/skills) | Emil Kowalski | motion + component craft, animation passes |
| [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) | Paul Bakaus | interface audit and slop detection |
| [`mattpocock/skills`](https://github.com/mattpocock/skills) | Matt Pocock | prototype, grill-me |
| [`remotion-dev/skills`](https://github.com/remotion-dev/skills) | Remotion | video deliverables |

## Keeping ~130 skills without paying for them

Only `name` and `description` sit in context; a skill's body loads on invocation. With a
pool this size the descriptions alone run to roughly **10,000 tokens in every context
window**, which is a real cost for something used a few times per stage.

The fix is two halves, and the second is what keeps it from becoming a lock:

1. **Set the pool to `"name-only"`** in `~/.claude/settings.json` under `skillOverrides`.
   The name stays listed and stays invokable, by you and by the agent; only the
   description is dropped. Do **not** use `"off"` — that hides a skill from the `/` menu
   too and makes it uninvokable by anyone.
2. **Use the recommender as the index the descriptions used to be.** It reads them from
   disk on demand, so they cost nothing until asked for:

```bash
npm run skills -- --stage S1 --n 8 "dark editorial landing, heavy scroll motion"
npm run skills -- --stage S5 "3d hero drops frames on mobile"
npm run skills -- --list-stages
```

Ranking is IDF-weighted term overlap with a stage bias. It narrows ~160 skills to a
shortlist; it does not choose. It also cannot resolve polysemy — read the shortlist
rather than taking the top hit.

Keep the stage-required skills at `"on"`: the ones a stage cannot run without should
still announce themselves.

## Required

Without these the stage machine has holes. The S1 row is the important one: **each
direction needs a different author**, so a single taste skill is not enough — install
the set.

| Stage | Skill | Does | Install |
|---|---|---|---|
| S0 | `ui-ux-pro-max` | per-genre pattern presets, typography pairings, motion recipes, anti-pattern lists — reference reading before you diverge | `npx skills add nextlevelbuilder/ui-ux-pro-max-skill` |
| S1 | `high-end-visual-design`<br>`gpt-taste`<br>`minimalist-ui`<br>`industrial-brutalist-ui`<br>`design-taste-frontend` | five distinct visual authors — one per direction, never the same twice | `npx skills add Leonxlnx/taste-skill` |
| S1 | `imagegen-frontend-web` | renders a direction as sectioned images before any code exists | ↑ same source |
| S1 | `image-to-code` | implements a rendered design faithfully instead of approximately | ↑ same source |
| S2 · S5 | `impeccable` | interface audit and critique — a detector for AI-slop tells and general design defects, plus `/audit`, `/polish`, `/distill` | `npx skills add https://github.com/pbakaus/impeccable --skill impeccable` |
| S4 · S5 | `apple-design` | motion physics, gesture behavior, interruptible transitions | `npx skills add emilkowalski/skills` |
| S4 · S5 | `emil-design-eng` | component detail — the invisible work that separates working from good | ↑ same source |
| S5 | `find-animation-opportunities`<br>`improve-animations` | find what should move and does not, then implement it with real values | ↑ same source |

Three lines cover everything required:

```bash
npx skills add Leonxlnx/taste-skill
npx skills add emilkowalski/skills
npx skills add https://github.com/pbakaus/impeccable --skill impeccable
```

## Recommended

| Stage | Skill | Does | Install |
|---|---|---|---|
| S1 | `brandkit` | logo, mark, identity-board exploration | `npx skills add Leonxlnx/taste-skill` |
| S1 | `imagegen-frontend-mobile` | when the target is app screens rather than web | ↑ same |
| S1 | `prototype` | answers state and interaction questions a still image cannot | `npx skills add mattpocock/skills` |
| S2 | `grill-me` | interrogates a lock until every branch of the decision is resolved | ↑ same |
| S4 | `pick-ui-library` | picks the right dependency for a hard widget instead of hand-rolling | `npx skills add emilkowalski/skills` |
| S5 | `review-animations` | holds a motion diff to a craft bar; approval is earned | ↑ same |
| S5 | `redesign-existing-projects` | for a surface inherited from before the system | `npx skills add Leonxlnx/taste-skill` |
| S5 | `animation-vocabulary` | reverse-lookup: a described effect → its real name | `npx skills add emilkowalski/skills` |
| S4 | `remotion-best-practices` | only when the deliverable is video | `npx skills add remotion-dev/skills` |

## The S1 author pool

S1 needs a different author per direction, so the size of this pool is the ceiling on how
far a set of boards can actually diverge. Five authors means five directions at most before
you start repeating a voice.

[MengTo/Skills](https://github.com/MengTo/Skills) supplies about thirty more, each a
committed visual position rather than a general-purpose taste engine. Install individually:

```bash
npx skills add https://github.com/MengTo/Skills --skill <name>
```

**Editorial and structural** — `editorial-tech`, `editorial-portfolio-chapters`,
`editorial-service-booking`, `documentary-brutalist-agency`, `book-serif-index`,
`agency-grid-layout-minimal`, `split-layout-technical`, `technical-wireframe-info-layout`,
`framed-grid-layout`, `image-first-grid-layout`, `nested-container-clean-agency`,
`nested-container-frames`, `light-mode-paper-technical`, `clean-minimal-beige-light-mode`,
`orange-clean-paper-saas`, `solar-duotone-bold`, `high-contrast-skeuomorphic-clean`,
`skeuomorphic-ui`, `operational-enterprise-ai`, `product-proof-saas`.

**Atmospheric and effect-led** — `glass-dark-ui`, `dark-glass-clean-layout`,
`blue-laser-clean-glass-layout`, `mesh-gradient-dark-blue-clean`,
`funky-purple-container-tech`, `dark-blue-contrasting-clean`, `tech-green-dark-mode-modern`,
`blue-cloudy-clean-modern`, `dither-laser-dark-mode`, `glass-dark-mode-clock`.

The second group builds in exactly the vocabulary an ingredient blacklist would have banned:
glass, gradient, glow, permanent dark, saturated purple. **That is not a reason to exclude
them.** Gate 0 was rewritten in July 2026 precisely because slop is a completion problem
rather than a vocabulary one — a glass interface built with care is not slop, and an
editorial layout built without decisions is. These authors pass or fail the craft check on
the same terms as every other one.

**Page-type and reference** — `landing-page`, `pricing-page`, `build-awwwards-quality-sites`,
`company-logos`.

## Technique skills (S4 · S5)

Craft, not taste: they impose a method and hold no opinion about the look, so they never
argue with a locked direction. Same install form.

**Motion and scroll** — `animation-systems`, `animation-on-scroll`,
`cinematic-gsap-lenis-motion-system`, `gsap-scrolltrigger-storytelling`,
`cinematic-scroll-storytelling`, `scroll-progress-timeline`, `scroll-scrubbed-word-reveal`,
`scroll-scrubbed-visual-sequence`, `scroll-world-storytelling`, `staggered-word-reveal`,
`masked-reveal`, `marquee-loop`, `reveal-hover-effect`.

**Surface and detail** — `beautiful-shadows`, `css-alpha-masking`, `css-border-gradient`,
`progressive-blur`, `container-lines`, `corner-diagonals`, `corner-lasers`, `number-details`,
`beam-glow-states`, `liquid-metal-border`.

**Ambient and WebGL** — `ambient-section-particles`, `atmosphere-background`,
`gooey-blob-system`, `thinking-orbs`, `globe-particles`, `dither-background`,
`add-shader-cursor-trail`, `shaders-cursor-ripples`, `webgl-landing-steering`,
`bright-green-tech-system-webgl`.

**Imagery** — `unsplash-asset-images`, `aura-asset-images`. Sourced photography is a
legitimate material; whether a particular image is a decision or a placeholder is what gate 0
asks, and that question does not depend on where the file came from.

## Borrowed from game development

Four skills from the same repo's game section cover ground this system had listed as open
gaps. Expressive layer-3 surfaces are real-time rendering, so the techniques transfer.

| Skill | Fills |
|---|---|
| `optimize-threejs-games` | the missing performance gate — frame time, draw calls, texture budgets, adaptive quality, mobile |
| `test-playable-web-games` | how to make gate 4's "driven, not photographed" reproducible: deterministic fixtures plus real browser evidence |
| `build-game-camera-controls` | camera behaviour on 3D surfaces, which ENGINE says tokens cannot hold but which still needs principles |
| `create-game-vfx` | effects that stay readable *and* performance-safe, including reduced-motion alternatives |

## ui-ux-pro-max, and its two limits

It earns its place at S0 because a large, current dataset of what each genre actually does is
exactly the evidence divergence needs. It is also the one skill here with a documented reason
*not* to install, and both halves of that reason survive:

- **Never run its `--design-system` generator.** It writes a `design-system/MASTER.md` and
  positions that file as the project's source of truth. That role belongs to `tokens/` and
  cannot be shared. Read the data; do not let the tool own the system.
- **Its industry-to-style mapping is reductive.** Linear, Stripe and Notion are all "SaaS"
  and look nothing alike. A preset describes what a genre currently overproduces, which makes
  it useful as a map of the slop trap and dangerous as a brief.

Read it at S0. Do not carry it into S1, where it would become a sixth author with the blandest
possible opinions, or into S4, where it competes with the lock.

## The audit role

S2 and S5 both need something that critiques without authoring, and `impeccable`
([pbakaus/impeccable](https://github.com/pbakaus/impeccable)) is the house default. It
overlaps this repo's gate 0 deliberately — its detector catches slop tells at the
component level (side-tab accent borders, purple gradients, bounce easing, dark glows)
while gate 0 works at the page level, and the two disagree often enough to be worth
running both.

If you use something else, the requirement is the **role**: produces arguments instead
of pixels, run once before committing to a direction and again after the surface exists.

## Charts

If a brand encodes quantity anywhere, S3 should define the chart palette and encodings.
Claude Code ships a `dataviz` skill for this; other harnesses have equivalents. It is
not on the `skills` CLI, so nothing to install — just invoke it if your agent has it.

## The canvas tool

`ENGINE.md` §2.4 makes a canvas part of the loop (boards at S1, token combinations at
S3, layout-to-code at S4). The house default is [pen.dev](https://pen.dev) — an
MCP-native canvas whose `.pen` files live in the repo, so design and code are versioned
together. Install it per its own docs; it is a separate CLI/MCP server, not a skill.

Two policies, both ours rather than the tool's:

- **Tokens flow one way.** DTCG → build → canvas. The tool *can* write variables back
  to code; this system forbids it. A canvas-side edit is a proposal — apply it in the
  token source.
- **The canvas never substitutes for gates.** Looking right on canvas is a declaration.
  Gates 3 and 4 still run against the rendered DOM.

It is early-access software. If it is unavailable, fall back to the image path
(generate → implement to image); no stage blocks on it.

## If a skill is missing

Say so out loud and name what is being lost, then continue deliberately — do not
silently proceed as if the stage ran complete. Missing a taste skill at S1 is the
expensive case: with fewer authors the directions converge, and the run produces four
variations of one idea instead of four ideas.

This happened once already. Five skills sat disabled in config for an entire brand and
nobody noticed, which is why `WORKFLOW.md` names its tools per stage instead of trusting
anyone to remember them.
