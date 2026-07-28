# 천AI문 (chunaimun) — DESIGN.md

Character, not values. Every number lives in `tokens/`; this file holds the judgments a token
cannot carry.

Direction: **N3 연쇄**, locked S2 on 2026-07-28.
Approval: `.scratch/chunaimun/letter/approval-log/approval_260728_04_s2-lock-n3.md`
Board it was extracted from: `_design-system/auditions/chunaimun/n3-chain.html`
Product: an ebook line teaching 학원 원장 and 강사 to use AI. Four volumes, 1,001 prompts.

*This file replaced the R3 색인 카드 character on 2026-07-28. That lock was revoked; §6.1
(interaction) and §7 (depth, no blur) of the old file were good form and are re-derived here.*

## 1. Impression

**A prompt is a form with blanks, and each output becomes the next input.** What is sold is a
chain, not a list of tips.

The page is the sheet the form is printed on. The blue is a ballpoint — the mark a 원장 makes
on something already printed — and it is painted only where something gets filled in. Nothing
on this site glows, floats, or is made of glass; it is printed matter that happens to be able
to move.

The buyer is a professional buying professional material. The page earns trust by running the
product's own artefacts — a real prompt from `book.ts`, filled with real values — rather than
by claiming outcomes.

Not: dark-tech AI startup. Not: 참고서 cosplay. Not: infoproduct sales page. Not: warm
editorial cream, which is this process's own default and the ground the revoked lock sat on.

## 2. The blank

The signature device, and the only one. A rule that is **drawn, filled, and redrawn.**

It is the same object everywhere it appears, which is why `component/component.json` has one
`blank` and not three:

- in the hero, under the cycling output word;
- in the chain, as the slots being written into;
- on paper, as the line you actually write on.

**A blank shows the kind of thing that fills it.** A number reads `n`. A thing reads by its
noun — `학년`, `산출물`. This is how the form is printed in the book, so the site and the page
are notating the same object.

**The blank must earn the ground.** This is the S2 lock's countermeasure and it is the single
most load-bearing sentence in this file. White-with-blue is the closest coordinate in the
audition set to the AI product default; what keeps this brand off that coordinate is that the
white is *paper a form is printed on*, and the proof of that is a blank doing visible work. A
section with no blank being filled, drawn, or waiting has drifted, whatever else is right about
it. `scripts/check-drift.mjs` enforces this mechanically as the blank ledger.

## 3. Colour

Cool ground, printed ink, one pen. Chroma lives almost entirely in the pen and in the four
output inks; everything else is near-neutral and cool.

`pen` is an **ink, not an accent**. It never tints a surface for emphasis, never marks
"important", never appears where nothing is being filled in. `text.written` exists so that
"what the reader filled in" has its own role and cannot be borrowed for ordinary bold.

`kind.*` — exam · drill · analysis · mock — are **four roles, not four colours.** Each names a
document type the book produces. A fifth colour requires a fifth document type, which is a
product decision, not a design one. Using one of them decoratively is the failure mode; the
S2 audit caught them as inline hex literals in the markup, and naming them is the fix.

`ink.500` is the tertiary floor. There is deliberately no `ink.400`. Every S1 board shipped
metadata at 3.2–3.5:1 before gate 2 existed, all four of them, from all four taste skills —
the muted-grey-caption habit is uniform and invisible to every other gate.

## 4. Type

Two families, one axis.

- **IBM Plex Sans KR** carries the whole screen — display, sentence, UI, prose. One family
  across weights rather than two neutral Korean sans paired against each other. Its Latin *is*
  IBM Plex Sans, so Latin and Hangul are matched by construction rather than by luck.
- **Nanum Myeongjo** carries sustained reading and the entire ebook interior. Serif against
  sans is the real contrast axis; sans against sans is indecision.
- **IBM Plex Mono** is a register inside the first family, not a third voice: blank notation,
  figures, meta.

`size.display` is 96px and **there is no step above it.** The audition ran at 102px and read as
shouting. A headline that needs to be bigger needs to be shorter.

Leading has two floors, not one: body ≥ 1.5, display (≥ 26px) ≥ 1.2. Forcing 1.5 onto a 96px
Hangul line is a setting error, not compliance. Tracking floor is −0.03em; tighter and Hangul
counters collide.

`text-wrap: balance` on every heading, `pretty` on prose. The hero is a two-line Korean
headline and its rag is visible.

## 5. Motion — choreography

Quality is tokens (`motion.duration.*`, `motion.easing.*`). What follows is judgment, and
judgment cannot be a token (ENGINE §3).

**The reader drives; nothing plays at them.** The chain is scroll-scrubbed and fully
reversible — scroll back and the sentence un-fills. It is an instrument, not a video.

**Motion must encode something.** Scroll that advances an argument, a rule being drawn where
something is being filled, a word arriving because the output changed. Parallax for its own
sake, counters that count up, a hero that rebuilds on every scroll: gimmicks, whatever layer
permits them.

**The one exception that plays by itself** is the hero's output word, because its claim is
precisely that the output is not one thing. It pauses when the hero leaves the viewport. Its
rule is redrawn on arrival in the new ink, which is what ties it to the chain below — it is a
preview of the device, not a rotating word.

**Rule: the larger the change, the longer it takes.** A state change is 140ms; a word leaving
and arriving is 640ms; a blank being drawn is 560ms and starts slightly after the word so the
reader sees the writing follow the reaching.

**Deceleration only.** Exponential ease-out. No bounce, no elastic, no ease-in-out — a pen
stroke stops, it does not settle.

**Nothing may be gated on motion.** A reveal enhances an already-visible default; content that
only appears once a transition fires ships blank in a headless render or a background tab. The
audition board violates this — its three chain beats are stacked and separated only by GSAP —
and the Next build must render them in a readable static order first.

Under `prefers-reduced-motion` the movement goes and every state survives: the sentence is
whole, the blanks are filled, the first output word simply stays.

## 6. Depth and material

**There is no depth.** No shadow, no blur, no glass, no gradient — and not as a matter of
taste: the token set has no vocabulary for any of them, and `check-drift.mjs` fails the brand
if one appears. A surface under deadline has no shortcut to the default because the words for
it do not exist.

Input and output are told apart by **material**, not by an accent stripe: the sentence you
write sits on the page, and what comes back is a different stock (`surface.inverse`). The
audition originally used a left-border accent tab for this and it was removed — that pattern is
the AI callout card, and it is banned outright.

Elevation, where it is needed at all, is travel: a control lifts by `control.lift` on hover.
Nothing grows a shadow, because there is no shadow to grow.

## 7. Layout

Hairlines and space. **Cards are the lazy answer** — the four-volume lineup is rows, not a
four-up card grid, which is the exact shape gate 0 exists to catch. Nested cards are always
wrong.

Corners are square. `radius.pill` exists for controls only, because a thing you press is not a
thing that is printed.

Measure: prose 68ch, lede 46ch, claim 22ch. A claim is not prose and is not set like it.

## 8. The two media

Locked at S2, and the lock is what makes this section short.

**Web claims 연쇄.** It needs time to make its argument, and it has time.
**The interior claims 「지면은 채워 넣는 곳이다」.** Paper cannot show a chain; it can do the one
thing a screen cannot, which is be written on. Each prompt prints as a form with real room to
write — `page-print.write-height` and `page-print.pitch` are tokens precisely so that room is
not a layout accident.

What crosses from layer 1 and nothing else: the cool ground, the pen used only on blanks, the
blank-as-rule device, and the motion character.

**What is foreclosed:** the interior cannot borrow the web's proof. Any print page reaching for
the chain — arrows, numbered flow diagrams, before/after spreads — is importing an argument the
medium cannot carry, and is rejected on sight. The interior argues by being usable.

## 9. Known traps, paid for once already

- A breakpoint cannot be a runtime token in any tool. Media queries reject `var()`; Tailwind's
  `@theme` emits invalid CSS and fails the build. State the literal, let gate 1 verify it
  against a declared breakpoint token.
- `next/font` rewrites families to hashed names and breaks the token contract. Load fonts by
  `<link>`.
- Style Dictionary collides on group names shared across files. `output` (primitive) and
  `output` (component) collided during this very S3; the component group is `result` now.
- A server started by the Bash tool is invisible to the host browser. The user runs it.
- Gate 3 cannot see interaction, and a gate that silently skips is worse than one that fails.
  Every interaction added at S4 needs an assertion in `auditions/chunaimun/_drive.mjs`.
