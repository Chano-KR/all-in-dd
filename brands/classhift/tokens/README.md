# classhift tokens

Extraction source: `../../../auditions/classhift/r1b-locked.html` (the locked reference).
Build: `npm run build:tokens` from the repo root → `../dist/tokens.css`, `../dist/tokens.typ`.

## Layers

| Folder | Layer | May reference | Referenced by |
|---|---|---|---|
| `primitive/` | 1 — brand primitives | nothing | semantic only |
| `semantic/` | 2 — roles | primitives | components, product code |
| `component/` | 3 — component exceptions | semantic | that component only |

Product code references **semantic** tokens. Reaching past a layer (a component pulling a
primitive, a page pulling `paper.100` instead of `surface.page`) is the failure the three
layers exist to prevent, and it is what the hardcode gate looks for.

File-level `$description` is deliberately absent: Style Dictionary flattens it to an empty
token path and reports every file as a collision. Per-token `$description` is kept and is
where the reasoning lives.

Group names must be unique across the whole brand, not just within a file — the semantic
layer therefore uses `gap`, `corner` and `font-weight` where the primitive layer already
owns `space`, `radius` and `weight`.

## What the tokens encode about this direction

- **Red is one colour with one job** — CTA fill, the gestural mark, and the attention state
  in data surfaces. `accent.*` is intentionally short. Adding a role here needs a recorded
  decision, not a convenient reference.
- **Green is the rule colour**, not a decorative accent, plus exactly one dark surface
  (`surface.inverse`). Layer-3 work (3D scenes) inherits that surface as its ground so the
  scene does not invent its own dark.
- **The type ladder is thin in the middle on purpose.** Impact in this direction comes from
  jumping from `micro`/`meta` to `headline`/`hero`, not from filling the gap.
- **Line-height values are Korean floors.** `leading.body` at 1.85 and `leading.hero` at 1.04
  are not stylistic preferences; below roughly 1.02 the Hangul jamo stack collides, which was
  observed as a defect during the auditions.
- **`radius.none` is the default.** A rounded corner is a deviation in this system.

## Print crossing

`tokens.typ` converts px to pt at 96dpi (×0.75) — a print point is not a CSS pixel. Values
that have no meaning in print are emitted as commented-out skips rather than silently
dropped: durations, easing curves, and `ch`-based measures.
