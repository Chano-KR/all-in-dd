# WORKFLOW — the stage machine

`ENGINE.md` says what is true of the values. This file says how you get from "no idea
what this looks like" to a shipped surface without the result sliding back into the
model's default. Six stages, and each one names what loads inside it.

Written after a full validation run produced work the owner called AI slop. The
post-mortem found three causes and all three were process, not taste:

1. **No stage named its tools.** Tool use depended on the agent remembering. It did not.
2. **The strongest visual skills were switched off** in config and could not be invoked at
   all. Nobody noticed for an entire brand.
3. **The anti-slop gates were treated as the brief.** They say what *not* to do. A surface
   that only passes gates is inert, and the run shipped exactly that.

The rule that follows from #3 governs every stage below:

> **Gates are a floor, never a target.** Passing them means the work is not slop. It does
> not mean the work is good. Every stage must also produce a *positive* argument — a claim,
> a device, a reason to look — and that argument is what gets reviewed.

## Entry

```
throwaway one-off?              → outside the system, tokens as reference only
brand not established yet?      → S0, full path
editing an existing artifact?   → S5
solvable inside current tokens? → S4
not solvable inside them?       → S3, then S4
```

Ask before entering any stage. Auto-escalating turns a small request into a project.

## On tools

This repo is harness-agnostic, so the stages below name **kinds** of tool, not the
skill names of any one agent setup. Map them to whatever your harness has:

| Kind | What it does | Belongs to |
|---|---|---|
| **taste** | imposes a look — type, palette, composition opinions | **S1 only**, one per direction |
| **craft** | imposes technique — motion physics, component detail, a11y behavior; style-neutral | S4, S5 |
| **audit** | judges without authoring; produces arguments, not pixels | S2, S5 |
| **make** | produces artifacts — image generation, prototypes, identity boards, charts | wherever a stage calls for it |

**Required means loaded, not obeyed.** The failure these lists fix was tools never being
invoked, not tools being followed too loosely. Load it, then depart wherever the brand
demands and record the departure and its reason. A required tool is a lens you look
through, never a mold the work fits.

If a required tool is unavailable, say so and name what is being lost. Do not silently
continue.

## S0 — research

Assemble the evidence S1 diverges from. Choose no direction; an early favorite quietly
kills divergence at S1.

- Read `research/` first — `03-anti-slop.md` (the checks), `02-uiux-promax-and-genres.md`
  (genre presets). **Always before any web search**: the reverse order lets search results
  contaminate the gate-0 list.
- **The web reference sweep is mandatory**, and it is worth delegating to a cheaper model
  in a subagent — the main thread's context is for judgment, not result dumps. It must
  return **8+ named references with URLs** (individual entries, never a summary), **at
  least 3 from outside the genre** (non-generic ideas arrive by transfer from adjacent
  fields; a same-genre sweep converges on the genre's average), and **screenshots rather
  than descriptions** — S1 is image-first, so S0 evidence must be visual.
- If the sweep returns mostly template farms and CRO blogs, that pool *is* the slop trap
  for this genre. Record it as one.

Output: a research report — what the brand must be true to, which surfaces it covers,
impressions to avoid, the sweep, language constraints, open questions.

## S1 — diverge

Four to six fully rendered directions. **This is the stage that decides whether the brand
is any good**; everything downstream just executes it well.

- **One taste tool per direction, never the same one twice.** Directions authored by one
  voice converge no matter how different their briefs claim to be. Different authors are
  the cheapest guarantee of real divergence.
- **Draw before you code.** Generate the design as an image first, then implement to it.
  Skipping this produces boxes and rules arranged by a text model, which is a different
  craft from art direction and reads like it.
- A canvas tool (see ENGINE §2.4) earns its place here: an image gives art direction but
  cannot be pushed around. Fall back to the pure image path if unavailable.

Every board carries a spec rail — claim, how the claim is encoded, distance from the
reference, type and palette, its own risk. The rail is the evidence S2 compares, so
overstating it corrupts the whole comparison. Gate 0 runs on every board *before* anyone
sees it.

## S2 — compare and lock

Lock three things: tone, the signature device, and the encoding scheme. Grafting one
board's device onto another's tone is a normal outcome; picking a whole board is not
required.

Run an audit tool over the whole set before recommending anything. Write the lock down —
what is locked **and what it forecloses**, most importantly which enforcement layer
(ENGINE §1) the tone lands in, because a layer-3 tone cannot later descend into a dense
print interior.

## S3 — tokenize

Extract the locked board into DTCG JSON. Runs once per brand, and again whenever a later
stage needs a value the set does not have.

Settle here, not later:

- the medium fork (ENGINE §2.1) — which roles may differ between screen and paper;
- the styling default per web genre (ENGINE §2.2);
- **state tokens** — hover, focus, press. Their absence is what ships a dead interface
  while every screenshot gate passes;
- motion *quality*. Choreography stays prose in `DESIGN.md`, never a token (ENGINE §3).

Run `npm run gate:drift` here rather than at S4. Every other gate judges an artifact after
it exists; this one judges the vocabulary, so it runs before a surface can inherit the
problem.

## S4 — produce

The everyday loop: build the real surface. All gates run.

Requirements are **conditional on the surface's enforcement layer** (ENGINE §1), because a
layer-3 surface inherits primitives only:

| | Layers 1+2 | Layer 3 (expressive) |
|---|---|---|
| craft tools | required | recommended — uniform craft defaults are their own convergence risk |
| taste tools | **barred** | at most **one**, declared before work starts, tokens still untouchable |

**Taste tools are barred on layer 1+2 surfaces**, and this is not a preference. At S1 a
taste tool is the engine of divergence. At S4 the look is already locked, so invoking one
means a second authority arguing with the tokens, and the surface drifts toward that
tool's house style instead of the brand's. If S4 feels like it needs one, the tokens are
underspecified — that is an S3 return, not a tool call.

## S5 — refine

Audit → critique → iterate → verify, on something that already exists. Audit tools belong
here; so does a motion pass (find what should animate and does not, then implement those
with exact values).

**The rule the system lives or dies by:** if refinement needs something outside the
tokens, go back to S3 and change the token. Never override locally in one file.

## Gates

Full text in `ENGINE.md` §4. Where they run:

| Gate | Runs at | Catches |
|---|---|---|
| 0 anti-slop | S1 · S4 | the model's distributional default, before anyone sees the work |
| 0b drift | **S3** | whether the brand's vocabulary can express the default at all |
| 1 hardcode | S4 · S5 | literals in source, including Tailwind arbitrary values |
| 2 accessibility | S4 · S5 | contrast against the rendered surface, not the intended one |
| 3 render | S4 · S5 | what it actually looks like at target sizes |
| 4 interaction | S4 · S5 | hover, focus, motion, reduced-motion — invisible to a screenshot |

A gate failure returns the work to S4. It is not waived.

Two things gate work taught, both worth carrying to any new check:

- **Verify a new rule in both directions.** Run it against deliberately poisoned input.
  The first color-band test was written to catch one specific off-white and let a
  different one straight through, because the property it measured was not the property
  that mattered.
- **A gate that skips silently is worse than one that fails.** If a check cannot find its
  target, that is a failure, not a pass. A hover check that matched nothing is how a dead
  interface shipped green.

## Paper trail

Every stage leaves one document — not ceremony, but what makes the next run cheaper than
the last. Research report at S0, development logs with an honest status line at S1 and
S3–S5, and a signed approval record at S2, because a lock nobody wrote down is not a lock.

Always record two things: **what was not done**, and **every defect found in the system
itself**. A run that quietly fixes a process flaw and never writes it down has fixed
nothing durable — the next run rediscovers it from scratch.
