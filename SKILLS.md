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
| [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) | Leon | the S1 authors, imagegen, image-to-code, brandkit |
| [`emilkowalski/skills`](https://github.com/emilkowalski/skills) | Emil Kowalski | motion + component craft, animation passes |
| [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) | Paul Bakaus | interface audit and slop detection |
| [`mattpocock/skills`](https://github.com/mattpocock/skills) | Matt Pocock | prototype, grill-me |
| [`remotion-dev/skills`](https://github.com/remotion-dev/skills) | Remotion | video deliverables |

## Required

Without these the stage machine has holes. The S1 row is the important one: **each
direction needs a different author**, so a single taste skill is not enough — install
the set.

| Stage | Skill | Does | Install |
|---|---|---|---|
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
