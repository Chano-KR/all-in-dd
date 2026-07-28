# chunaimun tokens

DTCG JSON. Built by `npm run build:tokens` to `../dist/tokens.css` and `../dist/tokens.typ`.
Never edit `dist/`.

```
primitive/   raw values. Never reference anything.
semantic/    roles. Reference primitives only.
component/   per-component exceptions. Reference semantic only.
```

## Files

| File | Holds |
|---|---|
| `primitive/color.json` | bone / ink / signal / rule-blue ramps |
| `primitive/font.json` | the two families |
| `primitive/scale.json` | space, two size ladders (screen + print), borders, radii, offsets, weights, motion |
| `semantic/color.json` | surface · text · line · accent · shadow. **Shared across media.** |
| `semantic/layout.json` | fonts, weights, line weights, corners, depth, gaps, motion. **Shared across media.** |
| `semantic/medium.json` | **the fork** — `web.*` and `print.*` type and frame roles |
| `component/component.json` | card, hole, slot, deck, button, caret, prompt, meta |

## The fork

Approved at S3 on 2026-07-28; rule written into `ENGINE.md` §2.1.

Forked: type size, leading, tracking, measure, page frame. Those are bound to the physics of
the medium — reading distance, page vs viewport, ink vs light.

Not forked, and not negotiable: **primitives, colour, components.** Colour that changes
meaning by medium is two roles wearing one name. Components stay medium-blind and take
medium-bound numbers from the surface, which keeps the fork in this one file.

Consume one namespace per surface. `--ds-web-*` for screens, `ds-print-*` for the Typst
interior. Mixing them renders fine and is still a bug.

`print.frame.page-w` and friends exist only under `print` — that is medium-specific, not
forked, and it is allowed.

## Two traps recorded in the values themselves

- **Hangul mono weights.** `weight.bold` is 700 and there is nothing between it and 400,
  because Nanum Gothic Coding ships only those. Any other weight on Korean mono is synthetic.
- **No blur token.** `offset.*` is the entire depth model. The absence is deliberate; adding a
  blur token would let glassmorphism back in through the front door.
