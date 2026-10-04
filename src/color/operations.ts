import type { ColorConversionResult, ColorFormat, ColorValue, OklabColor, OklchColor } from "./types.js";
import { colorToOklab, colorToSrgb, convertColor, srgbChannelsToColor } from "./conversion.js";
import { InvalidColorError, normalizeColor, validateColorInput } from "./validation.js";

export type Seed = number | string;
export interface OklchConstraints { lightness?: readonly [number, number]; chroma?: readonly [number, number]; hue?: readonly [number, number] }
export type GeneratedColorResult =
  | { algorithm: "mulberry32-v1"; seed: number | string; colors: ColorValue[] }
  | { algorithm: "Math.random"; colors: ColorValue[] };

function uintSeed(seed: Seed): number {
  if (typeof seed === "number") {
    if (!Number.isSafeInteger(seed)) throw new InvalidColorError("Numeric seed must be a safe integer");
    return seed >>> 0;
  }
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) hash = Math.imul(hash ^ seed.charCodeAt(i), 0x01000193);
  return hash >>> 0;
}
function mulberry32(initial: number): () => number {
  let state = initial;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function range(name: string, values: unknown, defaults: readonly [number, number], min: number, max: number): readonly [number, number] {
  const pair = values === undefined ? defaults : values;
  if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== "number" || typeof pair[1] !== "number"
    || !Number.isFinite(pair[0]) || !Number.isFinite(pair[1]) || pair[0] < min || pair[1] > max || pair[0] > pair[1]) {
    throw new InvalidColorError(`Invalid ${name} constraint`);
  }
  return [pair[0], pair[1]];
}
export function generateColors(count: number, options: { seed?: Seed; constraints?: OklchConstraints } = {}): GeneratedColorResult {
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new InvalidColorError("Color count must be an integer from 1 to 1000");
  if (typeof options !== "object" || options === null || Array.isArray(options)) throw new InvalidColorError("Generation options must be an object");
  if (options.seed !== undefined && typeof options.seed !== "string" && typeof options.seed !== "number") throw new InvalidColorError("Seed must be a string or safe integer");
  const rawConstraints: unknown = options.constraints;
  if (rawConstraints !== undefined && (typeof rawConstraints !== "object" || rawConstraints === null || Array.isArray(rawConstraints))) throw new InvalidColorError("Constraints must be an object");
  const constraints = options.constraints ?? {};
  const lightness = range("lightness", constraints.lightness, [0, 1], 0, 1);
  const chroma = range("chroma", constraints.chroma, [0, 0.4], 0, 0.4);
  const hue = range("hue", constraints.hue, [0, 360], 0, 360);
  const random = options.seed === undefined ? Math.random : mulberry32(uintSeed(options.seed));
  const colors = Array.from({ length: count }, () => ({
    format: "oklch" as const,
    value: {
      l: lightness[0] + random() * (lightness[1] - lightness[0]),
      c: chroma[0] + random() * (chroma[1] - chroma[0]),
      h: ((hue[0] + random() * (hue[1] - hue[0])) % 360 + 360) % 360
    }
  }));
  return options.seed === undefined
    ? { algorithm: "Math.random", colors }
    : { algorithm: "mulberry32-v1", seed: options.seed, colors };
}

function oklch(color: ColorValue): OklchColor {
  const validated = validateColorInput(color);
  if (validated.format === "oklch") return validated.value;
  const lab = validated.format === "oklab" ? validated.value : colorToOklab(validated);
  const chroma = Math.hypot(lab.a, lab.b);
  if (![lab.l, lab.a, lab.b, chroma].every(Number.isFinite)) throw new InvalidColorError("OKLCH conversion produced non-finite values");
  return {
    l: lab.l, c: chroma,
    h: chroma < 1e-7 ? 0 : ((Math.atan2(lab.b, lab.a) * 180 / Math.PI) % 360 + 360) % 360,
    ...(lab.alpha === undefined ? {} : { alpha: lab.alpha })
  };
}
function fromOklch(value: OklchColor): ColorValue { return normalizeColor({ format: "oklch", value }); }
export function rotateHue(color: ColorValue, degrees: number): ColorValue {
  if (!Number.isFinite(degrees)) throw new InvalidColorError("Hue rotation must be finite");
  const value = oklch(color);
  return fromOklch({ ...value, h: ((value.h + degrees) % 360 + 360) % 360 });
}
export function adjustLightness(color: ColorValue, amount: number): ColorValue {
  if (!Number.isFinite(amount)) throw new InvalidColorError("Lightness adjustment must be finite");
  const value = oklch(color);
  return fromOklch({ ...value, l: Math.min(1, Math.max(0, value.l + amount)) });
}
export function adjustChroma(color: ColorValue, amount: number): ColorValue {
  if (!Number.isFinite(amount)) throw new InvalidColorError("Chroma adjustment must be finite");
  const value = oklch(color);
  return fromOklch({ ...value, c: Math.max(0, value.c + amount) });
}
/** Scales OKLCH chroma by a relative delta: 0.5 adds 50%, -1 removes all chroma. */
export function adjustSaturation(color: ColorValue, relativeDelta: number): ColorValue {
  if (!Number.isFinite(relativeDelta) || relativeDelta < -1) throw new InvalidColorError("Saturation adjustment must be a finite relative delta of at least -1");
  const value = oklch(color);
  return fromOklch({ ...value, c: value.c * (1 + relativeDelta) });
}
export function grayscaleColor(color: ColorValue): ColorValue { return fromOklch({ ...oklch(color), c: 0, h: 0 }); }
export function invertColor(color: ColorValue): ColorValue {
  const source = colorToSrgb(color);
  const format: ColorFormat = validateColorInput(color).format;
  return srgbChannelsToColor(1 - source.r, 1 - source.g, 1 - source.b, source.alpha, format);
}
export function adjustAlpha(color: ColorValue, alpha: number): ColorValue {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new InvalidColorError("Alpha adjustment must be in [0,1]");
  const normalized = validateColorInput(color);
  if (normalized.format === "hex") {
    const rgb = convertColor(normalized, "rgb").output;
    if (rgb.format !== "rgb") throw new InvalidColorError("Unable to adjust alpha");
    return convertColor({ format: "rgb", value: { ...rgb.value, ...(alpha === 1 ? {} : { alpha }) } }, "hex").output;
  }
  return normalizeColor({ ...normalized, value: { ...normalized.value, ...(alpha === 1 ? {} : { alpha }) } });
}

export function mixColors(first: ColorValue, second: ColorValue, weight = 0.5, space: "oklab" | "srgb" = "oklab"): ColorValue {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new InvalidColorError("Mix weight must be in [0,1]");
  if (space !== "oklab" && space !== "srgb") throw new InvalidColorError("Mix space must be oklab or srgb");
  const a = validateColorInput(first), b = validateColorInput(second);
  if (space === "oklab") {
    const ca = colorToOklab(a), cb = colorToOklab(b), alphaA = ca.alpha ?? 1, alphaB = cb.alpha ?? 1;
    const alpha = alphaA * (1 - weight) + alphaB * weight;
    const channel = (x: number, y: number): number => alpha === 0 ? 0 : (x * alphaA * (1 - weight) + y * alphaB * weight) / alpha;
    const value: OklabColor = {
      l: channel(ca.l, cb.l), a: channel(ca.a, cb.a), b: channel(ca.b, cb.b),
      ...(alpha === 1 ? {} : { alpha })
    };
    return normalizeColor({ format: "oklab", value });
  }
  const ca = colorToSrgb(a), cb = colorToSrgb(b), alpha = ca.alpha * (1 - weight) + cb.alpha * weight;
  const channel = (x: number, y: number): number => alpha === 0 ? 0 : (x * ca.alpha * (1 - weight) + y * cb.alpha * weight) / alpha;
  return normalizeColor({ format: "rgb", value: {
    r: Math.round(channel(ca.r, cb.r) * 255), g: Math.round(channel(ca.g, cb.g) * 255), b: Math.round(channel(ca.b, cb.b) * 255),
    ...(alpha === 1 ? {} : { alpha })
  } });
}

export interface OklchStop { position: number; color: ColorValue }
export type ScaleColor = ColorConversionResult & { position: number };
export function generateOklchScale(stops: readonly OklchStop[], count: number, outputFormat: ColorFormat = "hex"): ScaleColor[] {
  if (!Number.isInteger(count) || count < 2 || count > 101) throw new InvalidColorError("Scale count must be an integer from 2 to 101");
  if (!Array.isArray(stops) || stops.length < 2 || stops.length > 10 || !stops[0] || !stops[stops.length - 1]
    || stops[0].position !== 0 || stops[stops.length - 1].position !== 1) {
    throw new InvalidColorError("Scale requires 2 to 10 stops spanning positions 0 and 1");
  }
  const normalized = stops.map((stop, index) => {
    if (typeof stop !== "object" || stop === null || Array.isArray(stop)) throw new InvalidColorError("Scale stops must be objects");
    if (!Number.isFinite(stop.position) || stop.position < 0 || stop.position > 1 || (index > 0 && stop.position <= stops[index - 1].position)) throw new InvalidColorError("Scale stop positions must be strictly increasing in [0,1]");
    return { position: stop.position, color: oklch(stop.color) };
  });
  if (normalized.some((stop, i) => i > 0 && stop.color.l < normalized[i - 1].color.l)) throw new InvalidColorError("Scale stop lightness must be non-decreasing");
  const firstAlpha = normalized[0].color.alpha ?? 1;
  if (normalized.some((stop) => (stop.color.alpha ?? 1) !== firstAlpha)) throw new InvalidColorError("Scale stops must use the same alpha value");
  return Array.from({ length: count }, (_, index) => {
    const position = index / (count - 1);
    let right = normalized.findIndex((stop) => stop.position >= position);
    if (right < 0) right = normalized.length - 1;
    const left = Math.max(0, right - 1), a = normalized[left], b = normalized[right];
    const t = a.position === b.position ? 0 : (position - a.position) / (b.position - a.position);
    const startHue = a.color.c === 0 ? b.color.h : a.color.h;
    let hueDelta = ((b.color.h - startHue + 540) % 360) - 180;
    if (a.color.c === 0 || b.color.c === 0) hueDelta = 0;
    const value: OklchColor = {
      l: a.color.l + (b.color.l - a.color.l) * t,
      c: a.color.c + (b.color.c - a.color.c) * t,
      h: ((startHue + hueDelta * t) % 360 + 360) % 360,
      alpha: (a.color.alpha ?? 1) + ((b.color.alpha ?? 1) - (a.color.alpha ?? 1)) * t
    };
    const result = convertColor({ format: "oklch", value }, outputFormat);
    return { ...result, position };
  });
}

function variantScale(color: ColorValue, count: number, kind: "shades" | "tints" | "tones", outputFormat: ColorFormat): ColorConversionResult[] {
  if (!Number.isInteger(count) || count < 2 || count > 101) throw new InvalidColorError("Variant count must be an integer from 2 to 101");
  const base = oklch(color);
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const value = kind === "shades"
      ? { ...base, l: base.l * (1 - t), c: base.c * (1 - t) }
      : kind === "tints"
        ? { ...base, l: base.l + (1 - base.l) * t, c: base.c * (1 - t) }
        : { ...base, c: base.c * (1 - t) };
    return convertColor({ format: "oklch", value }, outputFormat);
  });
}
export function generateShades(color: ColorValue, count = 5, outputFormat: ColorFormat = "hex"): ColorConversionResult[] { return variantScale(color, count, "shades", outputFormat); }
export function generateTints(color: ColorValue, count = 5, outputFormat: ColorFormat = "hex"): ColorConversionResult[] { return variantScale(color, count, "tints", outputFormat); }
export function generateTones(color: ColorValue, count = 5, outputFormat: ColorFormat = "hex"): ColorConversionResult[] { return variantScale(color, count, "tones", outputFormat); }
