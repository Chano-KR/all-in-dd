/* Shared OKLCH <-> sRGB math. No dependencies, standard Björn Ottosson matrices.
   Forward (hex -> OKLCH) mirrors check-drift.mjs; reverse adds deterministic
   gamut mapping (binary-search chroma reduction, the CSS4 recommended shape)
   so the build owns the clamp instead of Typst's known-imperfect one.        */

const srgbToLinear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = c => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

export const hexToRgb = hex => {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? [...h].map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
};

const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

/* hex -> { L, C, H } (H in degrees, NaN-safe at zero chroma) */
export const hexToOklch = hex => {
  const [R, G, B] = hexToRgb(hex).map(c => srgbToLinear(c / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, b);
  const H = C < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { L, C, H };
};

/* { L, C, H } -> linear-light sRGB triple (unclamped, may exceed [0,1]) */
const oklchToLinear = ({ L, C, H }) => {
  const hr = (H * Math.PI) / 180;
  const A = C * Math.cos(hr);
  const B2 = C * Math.sin(hr);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B2) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B2) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B2) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const inGamut = rgb => rgb.every(c => c >= -1e-6 && c <= 1 + 1e-6);

/* Is an authored OKLCH colour representable in sRGB without clamping?
   The build warns on false: screen (P3-capable) and print would diverge.     */
export const oklchInSrgb = lch => inGamut(oklchToLinear(lch));

/* { L, C, H } -> sRGB hex. Out-of-gamut colours keep L and H and walk C down
   (13 bisection steps ≈ 0.0001 chroma precision) until they fit — the same
   intent as CSS Color 4 gamut mapping, deterministic and owned by this build. */
export const oklchToHex = ({ L, C, H }) => {
  let rgb = oklchToLinear({ L, C, H });
  if (!inGamut(rgb)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 13; i++) {
      const mid = (lo + hi) / 2;
      rgb = oklchToLinear({ L, C: mid, H });
      if (inGamut(rgb)) lo = mid; else hi = mid;
    }
    rgb = oklchToLinear({ L, C: lo, H });
  }
  return rgbToHex(rgb.map(c => Math.min(1, Math.max(0, linearToSrgb(c))) * 255));
};

/* Parse a CSS oklch() string: "oklch(62% 0.14 262)" / "oklch(0.62 0.14 262deg / 80%)".
   Returns { L, C, H, alpha } or null if it is not an oklch() string.          */
export const parseOklch = str => {
  const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/
    .exec(String(str).trim());
  if (!m) return null;
  const L = parseFloat(m[1]) / (m[2] ? 100 : 1);
  const alpha = m[5] === undefined ? 1 : parseFloat(m[5]) / (m[6] ? 100 : 1);
  return { L, C: parseFloat(m[3]), H: parseFloat(m[4]), alpha };
};
