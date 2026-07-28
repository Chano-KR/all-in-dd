# Classhift — DESIGN.md

Status: written at S3 from the locked direction (R1b). Values live in `tokens/`; this file
holds what values cannot. When the two disagree, the tokens win on values and this file wins
on judgment.

- Locked reference: `../../auditions/classhift/r1b-locked.html`
- Verdict record: `.scratch/design-system-v2/letter/approval-log/approval_260727_01_classhift-s2-verdict.md`
- Product decisions (frozen): `D:\01.Coding\02_Claude\classhift-website\PRD.md`

## 1. Impression

A ruled ledger a teacher writes into, printed on warm paper. Structure first, ornament
almost never. The page should read as something *kept* — a record with rules and margins —
rather than something marketed. Loud in one dimension only: type scale.

The audience is the academy owner and the instructor, not the learner. Calm, engineered,
professional. The Korean edtech market is uniformly loud, cute and learner-facing; every
decision here should widen that gap rather than close it.

## 2. Colour

Warm paper ground, near-black warm ink, chalkboard green as the rule colour, clip-red as the
single accent. Roles: `surface.*`, `text.*`, `line.*`, `accent.*` in `tokens/semantic/color.json`.

**Red does one job.** Primary CTA, the hand-drawn mark, and the attention state in data
surfaces. It does not tint cards, headings, links, icons or borders. A single accent against
a neutral ground is what reads as disciplined; repeating it dilutes the effect and reads as a
firm that does not understand its own positioning.

**Green is structure, not decoration.** It is the rule and the ink of the ledger. Exactly one
dark green surface exists (`surface.inverse`) and it is the ground layer-3 work inherits.

Red and green never share an edge at large sizes. The warm paper is what keeps the pairing
from reading as Christmas; a red block adjacent to a green block removes that mediator.

## 3. Typography

IBM Plex Sans KR for everything that is read; IBM Plex Mono for everything that is *labelled* —
navigation, eyebrows, marginal tabs, table headers, buttons, footnotes. That split is the
system's voice: prose in one register, machine annotation in another.

Plex Sans KR stops at 700. Emphasis therefore comes from size, not weight — the ladder is
deliberately thin in the middle so that jumps are large.

Korean rules, non-negotiable: `word-break: keep-all`, Hangul line-height floors
(`leading.body` 1.85, `leading.hero` 1.04), sizing decided Hangul-first with Latin riding
along. A Latin face with a system Hangul fallback is a failure, not a fallback.

## 4. Layout

A ruled grid with a narrow marginal tab column (`gap.tab-col`) carrying mono labels, and a
reading column capped at `measure.prose`. Rules are structural: `line-weight.rule` separates
sections, `line-weight.hair` separates rows. Corners are square.

Whitespace is not the impact device here — the rules and the scale jumps are. Do not answer
"this feels flat" by adding padding.

## 5. Gesture

One tactile register, used sparingly: chalk grain on the dark surface, and a hand-drawn
stroke (SVG path, never a font) as an underline or tick. This is where the education warmth
lives. Two gestures on one screen is one too many; the mark must read as something a person
drew once, not as a decorative system.

## 6. Motion

Duration and easing are tokens (`motion.*`). Choreography is judgment and stays here:

- The larger the distance or the size change, the longer the duration.
- Entrances are calm — no bounce, no overshoot. This brand does not perform enthusiasm.
- The gestural stroke may draw itself; nothing else in the identity animates for effect.
- `prefers-reduced-motion` is honoured with a static state, not a shortened one.

## 7. Depth

There is none. No shadows, no glass, no gradients on layer-2 surfaces. Separation is done
with rules and with the paper/raised/sunken tints. Depth belongs to layer 3, where the 3D
scene provides it physically.

## 8. Do / Don't

| Do | Don't |
|---|---|
| Reference semantic tokens | Reach past a layer for a primitive, or write a literal hex |
| Buy emphasis with size | Buy it by widening red's role |
| Let the mono register carry labels | Set body copy in mono |
| Keep one gesture per screen | Decorate with chalk texture |
| Keep corners square | Round a card "to soften it" |
| Put dark sections on `surface.inverse` | Invent a second dark colour |

## 9. Agent guidance

Load this file plus `tokens/dist/tokens.css` (screen) or `tokens.typ` (print) before any
visual work under this brand. Then:

1. Decide the entry stage first (see `../../README.md`). Most work is S4 or S5.
2. Write only semantic-token references. A literal colour or an off-ladder spacing value is a
   gate failure, not a style choice.
3. Render at real target dimensions and look at the result before reporting completion.
4. If the work needs something the tokens do not have, stop and go to S3. Do not solve it
   locally in one file — that is the single failure mode that kills this system.
5. Layer-3 surfaces (3D, scroll-driven landings) inherit layer 1 only. That is by design, so
   do not force component rules onto them, and do not let them invent brand colours either.
