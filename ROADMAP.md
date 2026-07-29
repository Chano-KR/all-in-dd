# ROADMAP

Where this is going, and what each step would change about the rules. Written down mainly
so the *consequences* are decided in advance rather than discovered mid-build.

## 1.x — current

Command line and files. Tokens build to four media, gates run as scripts, the stage machine
lives in `WORKFLOW.md`, and a canvas (pen.dev) sits outside the repo filling the Figma role.

Open work at this level: a performance gate that actually runs, dark-mode as a token axis,
mobile/native media, and the four unautomatable angles of gate 0.

## 2.0 — gates and stage status, visible

**A window onto state, not an editor.** The system already asks people to judge things a
terminal cannot show: S1 board comparison, S3 token combinations, gate 3's rendered output,
and four of gate 0's six angles. Today those are PNGs opened by hand and script output read
in a scrollback.

What it would show:

- **Stage status per brand** — which stage each brand sits in, what its last gate run said,
  what is stale. `build-tokens --check`, `check-drift`, `check-tokens` and the interaction
  check already emit this; nothing new needs measuring, only surfacing.
- **Gate results as a surface, not a log.** Gate 3 is screenshots and gate 4 is driven
  states; both are visual evidence being read as text today.
- **The craft check's six angles**, with the rendered surface beside them. Angles 1, 2, 3
  and 6 are human judgement by design — the tool's job is to put the evidence in front of
  the judgement, not to replace it.
- **Token inspection**: roles, their resolved values per medium, and which surfaces
  reference them.

**Rule impact: none.** Read-only over existing artefacts. That is what makes it the right
first step — it can be wrong without costing anything.

## 3.0 — replace the canvas

**Absorb the pen.dev role.** ENGINE §2.4 currently concedes a real dependency: a
third-party, pre-1.0, React-and-MCP canvas that owns the boards. Replacing it removes an
external dependency from the middle of S1, S3 and S4.

Two things must be true before this is worth attempting, and both are decisions rather than
features:

1. **Tokens still flow one way.** §2.4 forbids canvas-side writes back to the token source
   precisely because two writable sources of truth void the S5 → S3 rule. Owning the canvas
   makes that rule *easier* to break, not harder. The editor must therefore treat a
   canvas-side value change as what it already is: a proposal that resolves by editing the
   DTCG source and rebuilding.
2. **The canvas still does not substitute for gates.** Looking right in an editor is a
   declaration; gates 3 and 4 run against the rendered DOM. An in-house canvas will be
   tempting to trust more than an external one, and it should not be.

**Rule impact:** ENGINE §2.4 gets rewritten from "the house default is pen.dev, here are our
policies about it" to "the canvas is part of this system, and here are the same policies as
invariants." The policies survive the change of owner — that is the point of having written
them as policies rather than as tool workarounds.

## Not on the roadmap

- A token editor as the *primary* surface. Values are authored as DTCG JSON on purpose:
  diffable, reviewable, one source. A GUI that becomes the authoring path re-creates the
  problem §2.4 exists to prevent.
- A component library of our own. Astryx exists and is maintained; forking that work buys
  nothing this system needs.
