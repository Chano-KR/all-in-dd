# ENGINE

Brand-agnostic rules. What is true regardless of which brand is loaded. Brand-specific
character lives in `brands/<brand>/DESIGN.md`; exact values live in `brands/<brand>/tokens/`.

## 1. Enforcement layers

Applying one uniform intensity to every surface is what stalled the previous system.
Three layers, each with a declared scope.

| Layer | What it holds | Enforced on |
|---|---|---|
| **1 — Brand primitives** | palette, typefaces, motion character (brisk vs. unhurried) | everything, no exceptions |
| **2 — Product system** | semantic tokens, components, layout patterns | tool-type (dashboards, forms, ERP) and document-type (print, slides, card news) |
| **3 — Expressive surfaces** | 3D scenes, scroll-driven landings, experimental heroes | **inherits layer 1 only** |

Layer 3 skipping layer 2 is a design decision, not a violation. Written down here so
that expressive work never has to relitigate "am I allowed to break the system."

Web splits three ways under the same rule:

| Web genre | Example | Layers |
|---|---|---|
| Tool-type | ERP dashboard, admin screens, forms | 1 + 2 in full |
| Content-type | blog, docs, ordinary landing | 1 + layer-2 tokens; components partial |
| Expressive | 3D landing, interactive hero | 1 only |

For 3D specifically: tokens **do** govern scene background, material base colors, fog,
light temperature. Tokens **do not** govern camera movement, geometry, scroll sequence,
or physics — those are not shapes a token can hold.

## 2. Media

One token source, four consumers. The table separates **contract** (invariant, stack-agnostic)
from **default implementation** (replaceable when a project's stack differs).

**The contract, for every screen medium:** tokens are consumed as CSS custom properties from
`dist/tokens.css`; no literal values in surface code; gates run against the rendered DOM.
Any stack that can read a CSS variable satisfies it — React, Svelte, Vue, Astro, vanilla.

| Medium | Output | Default implementation | Token access |
|---|---|---|---|
| Web / app | screens, dashboards, landings | per-genre, see §2.2 | `dist/tokens.css` (Tailwind: via `@theme inline` aliases) |
| Slides | 16:9 decks → PDF | HTML deck → headless capture | `dist/tokens.css` directly (slides are HTML) |
| Card news | 1080×1080 PNG | HTML → Playwright screenshot | `dist/tokens.css` directly |
| Print | A4 exams, workbooks, reports | **Typst → PDF** | `tokens.typ` (see §2.3) |

Print splits to Typst because page breaks, hyphenation, widow/orphan control, running
heads, auto TOC, and footnotes are first-class there and absent from CSS by concept.

### 2.1 The medium fork

*Amended 2026-07-28 during the `chunaimun` S3. Before this, §2 said the media differ only in
output format. That held for `classhift`, whose print work had not started. It broke the
moment one brand had to ship a web surface and an ebook interior from one identity.*

A brand **may** fork its semantic layer by medium. Most do not need to. The rule is narrow on
purpose, because "this should differ per medium" is an argument that will be made about every
token eventually.

**What may fork.** Only a role whose value is bound to the physics of the medium: reading
distance, page versus viewport, ink on stock versus light through glass. In practice that is
type size, leading, tracking, measure, and page geometry. Nothing else has qualified yet.

**What must not fork.**

- **Primitives never fork.** A brand has one palette and one set of faces. If the primitives
  differ, it is two brands — say so and split.
- **Colour never forks.** A role that means one thing on screen and another on paper is not
  one role, it is two roles sharing a name. Rename instead.
- **Components never fork.** They reference shared roles. When a component needs a
  medium-bound number, the *surface* supplies it from its own namespace. This is what keeps
  the fork inside one file rather than spreading through every component.

**Shape.** Forked roles live under `semantic/medium.json`, namespaced `web.*` and `print.*`,
and build to `--ds-web-…` / `--ds-print-…`. A consumer picks one namespace and never mixes.
A role present under only one namespace is not forked — it is medium-specific, which is also
allowed (`print.frame.page-w` has no web counterpart).

**Cost of not forking.** The alternative is pushing every difference into component tokens,
where the same distinction gets restated once per component and drifts. The alternative to
*that* is two brands, which costs the shared identity the system exists to hold.

Reference implementation: `brands/chunaimun/tokens/semantic/medium.json`.

### 2.2 Styling by web genre

*Added 2026-07-29.* One styling technology for all web work forced every genre through the
same vocabulary. The genres in §1 already differ in enforcement layer; they now also differ
in styling default. This is a **house rule**, not an industry citation.

| Web genre | Layers (§1) | Styling default | Why |
|---|---|---|---|
| Tool-type (dashboards, admin, forms) | 1 + 2 | Tailwind v4 + component library | speed and consistency outrank look |
| Content-type (blog, docs, ordinary landing) | 1 + layer-2 tokens | **scoped CSS + token variables** | token discipline outranks speed |
| Expressive (portfolio, one-pager, interactive hero) | 1 only | **scoped CSS + token variables** | the signature device lives outside any utility vocabulary |

"Scoped CSS + token variables" means: CSS Modules in React/Next, `<style>` blocks in
Svelte/Astro (scoped by default), `<style scoped>` or modules in Vue. The contract is the
*shape* — component-scoped rules whose only values are `var(--*)` — not one file format.

Why scoped CSS for the expressive column: a stylesheet whose only vocabulary is `var(--*)`
enforces gate 0b **structurally** — there is no utility scale to fall back on, so the model
default is unspeakable rather than merely forbidden. It also makes gate 1 a one-line grep,
and it is the natural home of signature devices (mask-image, blend modes, `::before`
layering, scroll-driven animation) that fight utility syntax.

Where Tailwind is used, **arbitrary values (`w-[347px]`, `text-[#1a2b3c]`) are a gate-1
failure**, identical to a hardcode in CSS. They accumulate as an undocumented parallel scale
that breaks "change the token, change the product." Extend `@theme` instead.

### 2.3 Print pipeline

Tokens reach Typst via a generated `tokens.typ`. **No DTCG→Typst tooling exists anywhere**
(verified 2026-07-29: npm, Typst Universe, forums — nothing); this pipeline is original, not
a stopgap. The alternative — Typst's `json()` reading the DTCG source directly, deleting the
generation step — was evaluated and rejected: it would force reimplementing alias resolution
(`{color.primary}`) and composite tokens inside Typst, which Style Dictionary already does
correctly once per build.

The generated-file path stands. Emitter upgrades **implemented 2026-07-29**
(`scripts/build-tokens.mjs`, verified by `typst compile` against a real brand):

- **Typed, nested emit.** All groups under one `#let ds = (…)` master dictionary —
  `ds.ink.at("900")`, `ds.sentence.size`. One dict, not one `#let` per group, because a
  group named `text` or `page` would shadow the Typst built-in on `import *` (found the
  hard way). Numeric steps and Typst keywords (`none`, `auto`, …) emit as string keys.
  Flat `#let ds-…` bindings remain as the compatibility surface.
- **Type-directed values.** hex (alpha survives) → `rgb("#…")`; px → bare `pt` literals;
  em passes through; `fontWeight` stays a number straight into `set text(weight:)` —
  Typst 0.15 variable fonts take axes from tokens, no per-weight font files.
- **Staleness check.** `node scripts/build-tokens.mjs --check` rebuilds and exits 1 on any
  dist drift. Wire it before `typst compile` and in CI — this closes the one advantage
  raw `json()` had.

**Colour space policy.** Tokens **may be authored as `oklch()` strings**; the pipeline is
now split-target: CSS passes `oklch()` through untouched (browsers resolve it, P3 headroom
stays open), while the Typst emit pre-converts to sRGB hex at build time via
`scripts/lib/color.mjs` — the build owns the gamut clamp (13-step chroma bisection, L and H
preserved), not Typst's known-imperfect one. The build **warns when an authored OKLCH value
sits outside sRGB**, because that is the point where screen and print genuinely diverge.
Default for new brands: author colour in OKLCH (it is the space gate 0b already thinks in —
drift bands are L/C/H bands, so authoring in the same space makes the vocabulary constraint
legible at the source). Existing hex-authored brands stay hex: the values are locked, a
notation migration buys nothing until a scale needs regenerating, and hex→OKLCH→hex
round-trips losslessly through the same lib whenever that day comes.

### 2.4 The canvas layer — pen.dev

*Added 2026-07-29.* pen.dev fills the Figma role in this system: the shared canvas where a
human and an agent edit the same artboards. Chosen over Figma because its canvas is
MCP-native and its `.pen` files live in the repo — versioned and branched with the code, so
design and build cannot drift apart the way an external design file does. A hand-off from a
canvas the agent cannot read is exactly the "describe the screen in prose, then code it"
path that produces boxes and rules.

Where it enters: **S1** to promote generated direction images into editable boards, **S3**
to see token combinations on canvas before S4 inherits them, **S4** to lay out on canvas
and land in code.

Two policies, both ours rather than the tool's:

- **Tokens flow one way.** DTCG JSON → build → canvas. The tool *can* write variables back
  to code (`SetVariables`); this system forbids it. A canvas-side variable edit is a
  proposal — apply it by editing the DTCG source and rebuilding, or it is an S3 return
  signal. Two writable sources of truth would void the S5→S3 rule.
- **The canvas never substitutes for gates.** Looking right on canvas is a declaration;
  gates 3 and 4 still run against the rendered DOM. Only the render is evidence.

pen.dev is early-access software. If it fails or is unavailable, fall back to the image
path (generate → implement to image) — the stages do not block on the tool.

## 3. Motion

Split in two. Only one half can be a token.

| Half | Content | Where it lives |
|---|---|---|
| **Quality** — how fast, what feel | duration steps, easing curves | tokens (DTCG supports both natively) |
| **Choreography** — what moves when, in what order | entrance order, stagger, scroll linkage, physics | `DESIGN.md` prose |

Choreography rules are judgments, not values. Example: *the larger the distance or size
change, the longer the duration.* That is a function, not a number — unwriteable as a
token, but it holds fine as one line of prose.

## 4. Gates

Run on every substantial deliverable. Skip only for micro-tweaks.

0. **Anti-slop binary gates** — run *before* anything is shown to the user, at S1 as well as
   S4. 12 web checks plus 6 Korean checks, each answerable yes/no; any "yes" is a failure, not
   a preference. They catch the model's distributional default (gradient hero, centred stack,
   three equal cards, glassmorphism, uniform radius, stock imagery, pill badge; and on the
   Korean side mid-word breaks, sub-1.5 leading, OS fallback Hangul, faux bold).
   Source: `research/03-anti-slop.md` §1 and §6, with per-genre presets in
   `research/02-uiux-promax-and-genres.md` PART 2. *(Relocated into this repo 2026-07-29 with
   user approval; the corpus previously sat orphaned in the deleted v1 system's bucket, which
   is why the first S0 ran without it.)*

   Known tells beyond the corpus list, from the 2026 external sweep — fold into the checks:
   badge-above-H1, colored card-edge borders (the single most recognizable tell), permanent
   dark mode as default, lavender/"VibeCode purple" palettes, serif-italic hero accent word,
   stat banner rows, identical top-icon feature cards, emoji section markers.

0b. **Drift check** — *added 2026-07-28 during the `chunaimun` S3.* Gate 0 asks whether a
   given artefact is the model's default. This asks whether the brand's **vocabulary can
   express** the default at all, which is the only version of the question that survives a
   deadline. A token set that cannot say blur, gradient, shadow or glass has no shortcut to
   them; one whose colours cannot land in the cream/sand OKLCH band cannot drift there while
   being renamed. It also decides contrast at the token layer rather than discovering it on a
   rendered page, and requires hover/press/focus to exist before any component does.

   Given surface files it runs the brand's **blank ledger** in two halves: the source half
   checks that every section *declares* the brand's signature device, and the evidence half
   (in the project's own interaction script) checks that the device is actually in the
   rendered DOM. A declaration is a promise; only the render is evidence.

   Implementation: `scripts/check-drift.mjs`. **Verify any rule of this shape in both
   directions** — the first cream-band test was written for `#E6E3DC` and let it through,
   because a warm near-white is warm by hue, not by saturation.

1. **Hardcode check** — a literal color (`#2563EB`) or arbitrary spacing (`17px`) in
   source is a failure. Layer-2 and below must reference semantic tokens, not primitives.
   **Tailwind arbitrary values (`w-[347px]`, `text-[#1a2b3c]`, `mt-[13px]`) are the same
   failure** — a bracket is a hardcode wearing utility syntax. Semantic naming matters
   beyond hygiene: agents reproduce token intent measurably better from semantic names
   than from raw values.
2. **Accessibility** — axe-core; contrast verified against the actual rendered surface,
   not the intended one.
3. **Render-verify** — screenshot at real target dimensions (1920×1080 slides,
   1080×1080 cards, A4 PDF, 375px + 1440px web), review, fix, re-render.

4. **Interaction check** — *added 2026-07-28.* Gates 0–3 are all things you can see in a still
   frame, and a still frame cannot see a hover state, a focus ring, a clipboard write, or a
   transition that was supposed to be suppressed. That blind spot is not theoretical: the first
   `chunaimun` build passed every gate and shipped with **no hover or focus states at all**,
   while gate 0 lists "hover states that do nothing" as a slop tell. The camera reported
   success because the defect is invisible to it.

   Any surface with state must therefore be driven, not photographed. At minimum:
   hover changes something; `:focus-visible` paints a ring and a mouse click does not; the
   promised motion actually runs and does not reflow what is under it;
   `prefers-reduced-motion` removes the motion while the state changes survive.
   Reference implementation: `scripts/check-interactions.mjs` (promoted from the first
   brand's project 2026-07-29; adapt per project, keep this copy canonical).

Failing a gate returns the work to S4. It does not get waived.

## 5. Korean text

- `word-break: keep-all` on all Korean body copy.
- Line-height floors are higher for Hangul than for Latin; size Hangul-first and let the
  Latin fallback ride along, never the reverse.
- Font pairing must name a matched Korean face. A Latin display face with a default
  system Hangul fallback is a failure, not a fallback.

### 5.1 House type library

*Set by the user 2026-07-29.* The pool S1 and S3 choose from. Mains first; an alternate
needs a stated reason in the dev log — not permission, a reason.

| Role | Mains | Kept alternates (installed) |
|---|---|---|
| Sans | **Wanted Sans · SUITE · SUIT · IBM Plex Sans KR** | Nanum Gothic, KoPub Dotum, Malgun Gothic |
| Serif | **Hahmlet** | Nanum Myeongjo, KoPub Batang, Batang |
| Mono | **Jetendard** (JetBrains Mono NF + Pretendard glyphs) | Nanum Gothic Coding, D2-family |

- All six mains are OFL — self-hosting and print embedding are clean. (The licensing gap
  in §6 remains for *alternates and future additions*, not for this table.)
- A brand still locks its own faces at S2/S3; this table is the menu, not the meal.
  Existing locks stand (`chunaimun`: IBM Plex Sans KR + Nanum Myeongjo — both in the pool).
- Files live in `fonts/` (gitignored, ~32 TTF) and are registered **user-scope** —
  `HKCU\…\Fonts` + `%LOCALAPPDATA%\Microsoft\Windows\Fonts`. New machine:
  `npm run install:fonts` (`scripts/install-fonts.ps1`) — idempotent, skips what is
  registered and on disk, repairs what is half-there, `-Force` reinstalls all. No admin.
- The Typst emitter strips CSS generic keywords (`system-ui`, `sans-serif`, …) from
  fontFamily tuples — they are web concepts, and each one cost a compile warning until
  2026-07-29. Print fallback chains carry real faces only.

## 6. Known gaps

Recorded 2026-07-29; deliberately deferred, not forgotten. Opening any of these is an S3-or-
system change, ask first.

- **Dark mode.** No theme axis in the token schema; gates 2–3 look at light only.
- **Mobile / native media.** §2 covers web, slides, cards, print. Mobile web rides the web
  row plus `imagegen-frontend-mobile`; native (SwiftUI/Compose) is undefined until a project
  forces it.
- **Font licensing.** §5 requires a matched Korean face but no gate checks embed/self-host
  rights for commercial deliverables.
- **Performance gate.** Expressive surfaces (scroll-driven, 3D) are exactly where jank
  ships; gate 3 could carry a CLS/LCP smoke check.
- **Accessibility depth.** Gate 2 is axe-core only (~30% coverage); a keyboard-traversal
  scenario belongs in gate 4.
- **Empty / error / loading states.** Half of tool-type surfaces; no gate photographs them.
- **Hallmark skill.** External anti-slop skill (57 checks, screenshot→"design DNA" study
  verb) overlapping gate 0 and the S0 sweep — evaluate for adoption.

## 7. Precedence

1. Explicit user instruction in the current conversation
2. `brands/<brand>/DESIGN.md`
3. This file
4. Skill defaults (skills own process; this system owns the look)
