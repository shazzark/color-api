import type {
  ColorFormat, ColorValue, ColorConversionResult, HexColor, HslColor, HsvColor,
  OklabColor, OklchColor, RgbColor
} from "./types.js";
import {
  InvalidColorError, normalizeColor, validateHexColor, validateHslColor,
  validateHsvColor, validateRgbColor, validateColorInput
} from "./validation.js";

export { InvalidColorError } from "./validation.js";

interface LinearColor { r: number; g: number; b: number; alpha: number }
const clamp = (n: number, min = 0, max = 1): number => Math.min(max, Math.max(min, n));
const round = (n: number, places: number): number => {
  const factor = 10 ** places;
  const value = Math.round(n * factor + Number.EPSILON * Math.abs(n * factor) * 4) / factor;
  return Object.is(value, -0) ? 0 : value;
};
function roundedHue(hue: number, places: number): number {
  const rounded = round(normalizeHue(hue), places);
  return rounded >= 360 ? 0 : rounded;
}
function normalizeHue(hue: number): number { return ((hue % 360) + 360) % 360; }
function alphaField(alpha: number): { alpha?: number } {
  const rounded = round(alpha, 4);
  return rounded >= 1 ? {} : { alpha: rounded };
}
function linearize(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
function delinearize(value: number): number {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}
function hslToEncoded({ h, s, l }: HslColor): [number, number, number] {
  const hue = normalizeHue(h) / 360, sat = s / 100, light = l / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const second = chroma * (1 - Math.abs((hue * 6) % 2 - 1));
  const match = light - chroma / 2;
  let rgb: [number, number, number];
  if (hue < 1 / 6) rgb = [chroma, second, 0];
  else if (hue < 2 / 6) rgb = [second, chroma, 0];
  else if (hue < 3 / 6) rgb = [0, chroma, second];
  else if (hue < 4 / 6) rgb = [0, second, chroma];
  else if (hue < 5 / 6) rgb = [second, 0, chroma];
  else rgb = [chroma, 0, second];
  return rgb.map((channel) => channel + match) as [number, number, number];
}
function hsvToEncoded({ h, s, v }: HsvColor): [number, number, number] {
  const hue = normalizeHue(h) / 60, sat = s / 100, value = v / 100;
  const chroma = value * sat, x = chroma * (1 - Math.abs((hue % 2) - 1)), m = value - chroma;
  let rgb: [number, number, number];
  if (hue < 1) rgb = [chroma, x, 0];
  else if (hue < 2) rgb = [x, chroma, 0];
  else if (hue < 3) rgb = [0, chroma, x];
  else if (hue < 4) rgb = [0, x, chroma];
  else if (hue < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];
  return rgb.map((channel) => channel + m) as [number, number, number];
}
export function oklabToLinearSrgb({ l, a, b }: OklabColor): [number, number, number] {
  const lp = l + 0.3963377774 * a + 0.2158037573 * b;
  const mp = l - 0.1055613458 * a - 0.0638541728 * b;
  const sp = l - 0.0894841775 * a - 1.291485548 * b;
  const ll = lp ** 3, mm = mp ** 3, ss = sp ** 3;
  return [4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * ll - 0.7034186147 * mm + 1.707614701 * ss];
}
export function linearSrgbToOklab([r, g, b]: [number, number, number]): Omit<OklabColor, "alpha"> {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return { l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s };
}
function linearToOklab(rgb: [number, number, number], alpha = 1): OklabColor {
  return { ...linearSrgbToOklab(rgb), ...alphaField(alpha) };
}
function oklchToLab(color: OklchColor): OklabColor {
  const radians = normalizeHue(color.h) * Math.PI / 180;
  return { l: color.l, a: color.c * Math.cos(radians), b: color.c * Math.sin(radians), ...alphaField(color.alpha ?? 1) };
}
function labToOklch(color: OklabColor): OklchColor {
  const c = Math.hypot(color.a, color.b);
  const achromatic = c < 1e-7;
  return { l: color.l, c: achromatic ? 0 : c, h: achromatic ? 0 : normalizeHue(Math.atan2(color.b, color.a) * 180 / Math.PI), ...alphaField(color.alpha ?? 1) };
}
function toLinear(color: ColorValue): LinearColor {
  let rgb: [number, number, number], alpha = 1;
  switch (color.format) {
    case "hex": {
      const digits = validateHexColor(color.value).slice(1);
      rgb = [0, 2, 4].map((i) => Number.parseInt(digits.slice(i, i + 2), 16) / 255) as [number, number, number];
      if (digits.length === 8) alpha = Number.parseInt(digits.slice(6, 8), 16) / 255;
      break;
    }
    case "rgb": rgb = [color.value.r / 255, color.value.g / 255, color.value.b / 255]; alpha = color.value.alpha ?? 1; break;
    case "hsl": rgb = hslToEncoded(color.value); alpha = color.value.alpha ?? 1; break;
    case "hsv": rgb = hsvToEncoded(color.value); alpha = color.value.alpha ?? 1; break;
    case "oklab": rgb = oklabToLinearSrgb(color.value); alpha = color.value.alpha ?? 1; return { r: rgb[0], g: rgb[1], b: rgb[2], alpha };
    case "oklch": rgb = oklabToLinearSrgb(oklchToLab(color.value)); alpha = color.value.alpha ?? 1; return { r: rgb[0], g: rgb[1], b: rgb[2], alpha };
  }
  return { r: linearize(rgb[0]), g: linearize(rgb[1]), b: linearize(rgb[2]), alpha };
}
function linearToHsl([r, g, b]: [number, number, number]): Omit<HslColor, "alpha"> {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l: round(l * 100, 2) };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
  if (h < 0) h += 360;
  return { h: roundedHue(h, 2), s: round(s * 100, 2), l: round(l * 100, 2) };
}
function linearToHsv([r, g, b]: [number, number, number]): Omit<HsvColor, "alpha"> {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  if (delta === 0) return { h: 0, s: 0, v: round(max * 100, 2) };
  const s = max === 0 ? 0 : delta / max;
  let h = max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
  if (h < 0) h += 360;
  return { h: roundedHue(h, 2), s: round(s * 100, 2), v: round(max * 100, 2) };
}
function inGamut(rgb: [number, number, number]): boolean { return rgb.every((v) => v >= 0 && v <= 1); }
function clipped(rgb: [number, number, number]): [number, number, number] { return rgb.map((v) => clamp(v)) as [number, number, number]; }
function deltaE(a: [number, number, number], b: [number, number, number]): number {
  const x = linearToOklab(a), y = linearToOklab(b);
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);
}
function mapToSrgb(rgb: [number, number, number], sourceOklch?: OklchColor): { rgb: [number, number, number]; mapped: boolean } {
  if (!rgb.every(Number.isFinite)) throw new InvalidColorError("Color conversion produced non-finite values");
  if (inGamut(rgb)) return { rgb, mapped: false };
  const originLab = linearToOklab(rgb);
  const origin = sourceOklch ?? labToOklch(originLab);
  if (origin.l <= 0) return { rgb: [0, 0, 0], mapped: true };
  if (origin.l >= 1) return { rgb: [1, 1, 1], mapped: true };
  const atChroma = (c: number): [number, number, number] => oklabToLinearSrgb(oklchToLab({ ...origin, c }));
  let current = rgb, clip = clipped(current);
  if (deltaE(clip, rgb) < 0.02) return { rgb: clip, mapped: true };
  let min = 0, max = origin.c, minInGamut = true;
  while (max - min > 0.0001) {
    const chroma = (min + max) / 2;
    current = atChroma(chroma);
    if (minInGamut && inGamut(current)) { min = chroma; continue; }
    clip = clipped(current);
    const difference = deltaE(clip, current);
    if (difference < 0.02) {
      if (0.02 - difference < 0.0001) return { rgb: clip, mapped: true };
      minInGamut = false;
      min = chroma;
    } else max = chroma;
  }
  return { rgb: clip, mapped: true };
}
function toPublic(color: LinearColor, format: ColorFormat): ColorValue {
  const alpha = color.alpha;
  if (format === "oklab") {
    const value = linearToOklab([color.r, color.g, color.b], alpha);
    return { format, value: { l: round(value.l, 4), a: round(value.a, 4), b: round(value.b, 4), ...alphaField(alpha) } };
  }
  if (format === "oklch") {
    const value = labToOklch(linearToOklab([color.r, color.g, color.b], alpha));
    return { format, value: { l: round(value.l, 4), c: round(value.c, 4), h: roundedHue(value.h, 4), ...alphaField(alpha) } };
  }
  const encoded = [delinearize(color.r), delinearize(color.g), delinearize(color.b)] as [number, number, number];
  if (!encoded.every(Number.isFinite)) throw new InvalidColorError("Color conversion produced non-finite values");
  if (format === "hex") {
    const bytes = encoded.map((v) => Math.round(clamp(v) * 255));
    const alphaByte = Math.round(alpha * 255);
    return { format, value: `#${bytes.map((v) => v.toString(16).padStart(2, "0")).join("")}${alphaByte < 255 ? alphaByte.toString(16).padStart(2, "0") : ""}` };
  }
  if (format === "rgb") return { format, value: { r: Math.round(clamp(encoded[0]) * 255), g: Math.round(clamp(encoded[1]) * 255), b: Math.round(clamp(encoded[2]) * 255), ...alphaField(alpha) } };
  if (format === "hsl") return { format, value: { ...linearToHsl(encoded), ...alphaField(alpha) } };
  return { format, value: { ...linearToHsv(encoded), ...alphaField(alpha) } };
}
function asRgb(value: ColorValue): RgbColor { if (value.format !== "rgb") throw new Error("Expected RGB color output"); return value.value; }
function asHsl(value: ColorValue): HslColor { if (value.format !== "hsl") throw new Error("Expected HSL color output"); return value.value; }
function asHsv(value: ColorValue): HsvColor { if (value.format !== "hsv") throw new Error("Expected HSV color output"); return value.value; }
function asHex(value: ColorValue): HexColor { if (value.format !== "hex") throw new Error("Expected HEX color output"); return value.value; }

// Legacy helpers remain exported for existing domain consumers.
export function hexToRgb(value: HexColor): RgbColor {
  const color = validateColorInput({ format: "hex", value });
  return asRgb(toPublic(toLinear(color), "rgb"));
}
export function rgbToHex(value: RgbColor): HexColor { return asHex(toPublic(toLinear({ format: "rgb", value: validateRgbColor(value) }), "hex")); }
export function rgbToHsl(value: RgbColor): HslColor { return asHsl(toPublic(toLinear({ format: "rgb", value: validateRgbColor(value) }), "hsl")); }
export function rgbToHsv(value: RgbColor): HsvColor { return asHsv(toPublic(toLinear({ format: "rgb", value: validateRgbColor(value) }), "hsv")); }
export function hslToRgb(value: HslColor): RgbColor { return asRgb(toPublic(toLinear({ format: "hsl", value: validateHslColor(value) }), "rgb")); }
export function hsvToRgb(value: HsvColor): RgbColor { return asRgb(toPublic(toLinear({ format: "hsv", value: validateHsvColor(value) }), "rgb")); }
export function hexToHsl(value: HexColor): HslColor { return asHsl(convertColor({ format: "hex", value }, "hsl").output); }
export function hexToHsv(value: HexColor): HsvColor { return asHsv(convertColor({ format: "hex", value }, "hsv").output); }
export function hslToHex(value: HslColor): HexColor { return asHex(convertColor({ format: "hsl", value }, "hex").output); }
export function hsvToHex(value: HsvColor): HexColor { return asHex(convertColor({ format: "hsv", value }, "hex").output); }
export function hslToHsv(value: HslColor): HsvColor { return asHsv(convertColor({ format: "hsl", value }, "hsv").output); }
export function hsvToHsl(value: HsvColor): HslColor { return asHsl(convertColor({ format: "hsv", value }, "hsl").output); }

export function convertColor(input: unknown, outputFormat: ColorFormat): ColorConversionResult {
  if (typeof outputFormat !== "string" || !["hex", "rgb", "hsl", "hsv", "oklab", "oklch"].includes(outputFormat)) {
    throw new InvalidColorError("Unsupported output color format");
  }
  const source = validateColorInput(input);
  const normalized = normalizeColor(source);
  if (source.format === outputFormat) return { input: normalized, output: normalized, gamutMapped: false };
  const raw = toLinear(source);
  if (![raw.r, raw.g, raw.b, raw.alpha].every(Number.isFinite)) throw new InvalidColorError("Color conversion produced non-finite values");
  let mapped = false;
  let working = raw;
  if (["hex", "rgb", "hsl", "hsv"].includes(outputFormat)) {
    const sourceOklch = source.format === "oklch"
      ? source.value
      : source.format === "oklab"
        ? labToOklch(source.value)
        : undefined;
    const result = mapToSrgb([raw.r, raw.g, raw.b], sourceOklch);
    working = { ...raw, r: result.rgb[0], g: result.rgb[1], b: result.rgb[2] };
    mapped = result.mapped;
  }
  const output = toPublic(working, outputFormat);
  return mapped
    ? { input: normalized, output, gamutMapped: true, gamutMapping: "css-color-4-local-minde" }
    : { input: normalized, output, gamutMapped: false };
}

/** Internal precision-preserving sRGB view for analysis and compositing. */
export function colorToSrgb(input: unknown): { r: number; g: number; b: number; alpha: number; gamutMapped: boolean } {
  const source = validateColorInput(input);
  const raw = toLinear(source);
  if (![raw.r, raw.g, raw.b, raw.alpha].every(Number.isFinite)) throw new InvalidColorError("Color conversion produced non-finite values");
  const mapped = mapToSrgb([raw.r, raw.g, raw.b], source.format === "oklch" ? source.value : source.format === "oklab" ? labToOklch(source.value) : undefined);
  return { r: delinearize(mapped.rgb[0]), g: delinearize(mapped.rgb[1]), b: delinearize(mapped.rgb[2]), alpha: raw.alpha, gamutMapped: mapped.mapped };
}

/** Full-precision OKLab coordinates for deterministic analysis. */
export function colorToOklab(input: unknown): OklabColor {
  const source = validateColorInput(input);
  const raw = toLinear(source);
  if (![raw.r, raw.g, raw.b, raw.alpha].every(Number.isFinite)) throw new InvalidColorError("Color conversion produced non-finite values");
  return { ...linearSrgbToOklab([raw.r, raw.g, raw.b]), ...(raw.alpha === 1 ? {} : { alpha: raw.alpha }) };
}

/** Converts full-precision encoded sRGB channels to a requested public format. */
export function srgbChannelsToColor(
  r: number, g: number, b: number, alpha: number, format: ColorFormat
): ColorValue {
  if (![r, g, b, alpha].every(Number.isFinite) || [r, g, b, alpha].some((value) => value < 0 || value > 1)) {
    throw new InvalidColorError("sRGB channels and alpha must be in [0,1]");
  }
  if (!["hex", "rgb", "hsl", "hsv", "oklab", "oklch"].includes(format)) {
    throw new InvalidColorError("Unsupported output color format");
  }
  return toPublic({ r: linearize(r), g: linearize(g), b: linearize(b), alpha }, format);
}
