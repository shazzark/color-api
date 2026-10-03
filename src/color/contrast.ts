import type { ColorValue, ContrastResult, RgbColor, WcagResults } from "./types.js";
import { colorToOklab, colorToSrgb, convertColor } from "./conversion.js";
import { InvalidColorError, normalizeColor } from "./validation.js";

export type ContrastCriterion = "wcag-2.2-1.4.3" | "wcag-2.2-1.4.11";
export type TextSize = "normal" | "large";
export const COMPOSITING_MODEL = "css-srgb-source-over" as const;

function linearizeChannel(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}
function roundToTwo(value: number): number { return Math.round(value * 100) / 100; }

export function relativeLuminance(color: RgbColor): number {
  if (![color.r, color.g, color.b].every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
    throw new InvalidColorError("Relative luminance requires integer sRGB channels from 0 to 255");
  }
  if (color.alpha !== undefined && color.alpha !== 1) throw new InvalidColorError("Relative luminance requires an opaque color");
  return 0.2126 * linearizeChannel(color.r) + 0.7152 * linearizeChannel(color.g) + 0.0722 * linearizeChannel(color.b);
}
export function contrastRatio(foreground: RgbColor, background: RgbColor): number {
  const a = relativeLuminance(foreground), b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function getWcagResults(ratio: number): WcagResults {
  return { normalText: { aa: ratio >= 4.5, aaa: ratio >= 7 }, largeText: { aa: ratio >= 3, aaa: ratio >= 4.5 } };
}

interface EncodedColor { r: number; g: number; b: number; alpha: number }
function encoded(color: ColorValue): EncodedColor { return colorToSrgb(color); }
function over(foreground: EncodedColor, background: EncodedColor): EncodedColor {
  const a = foreground.alpha, b = background.alpha;
  const outA = a + b * (1 - a);
  if (outA === 0) return { r: 0, g: 0, b: 0, alpha: 0 };
  const channel = (f: number, back: number): number => (a * f + (1 - a) * b * back) / outA;
  return { r: channel(foreground.r, background.r), g: channel(foreground.g, background.g), b: channel(foreground.b, background.b), alpha: outA };
}
function publicRgb(color: EncodedColor): ColorValue {
  const byte = (channel: number): number => Math.floor(channel * 255 + 0.5 + 1e-10);
  return { format: "rgb", value: { r: byte(color.r), g: byte(color.g), b: byte(color.b), ...(color.alpha === 1 ? {} : { alpha: color.alpha }) } };
}
function luminanceEncoded(color: EncodedColor): number {
  const linear = (channel: number): number => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
}
function resolvePair(foreground: ColorValue, background: ColorValue, canvas?: ColorValue): { foreground: EncodedColor; background: EncodedColor } {
  const fg = encoded(foreground), bg = encoded(background);
  const canvasColor = canvas === undefined ? undefined : encoded(canvas);
  if (canvasColor && canvasColor.alpha !== 1) throw new InvalidColorError("Canvas color must be opaque", [{ code: "INVALID_COLOR", path: "/canvas", message: "Canvas color must be opaque" }]);
  let effectiveBg = bg;
  if (bg.alpha < 1) {
    if (!canvasColor) throw new InvalidColorError("An opaque canvas is required for a translucent background", [{ code: "INVALID_COLOR", path: "/canvas", message: "An opaque canvas is required for a translucent background" }]);
    effectiveBg = over(bg, canvasColor);
  }
  return { foreground: over(fg, effectiveBg), background: effectiveBg };
}
export function compositeColors(foreground: ColorValue, background: ColorValue, canvas?: ColorValue): ColorValue {
  return publicRgb(resolvePair(foreground, background, canvas).foreground);
}

export interface ContrastOptions { criterion?: ContrastCriterion; textSize?: TextSize; context?: string; canvas?: ColorValue }
export function analyzeContrast(foreground: ColorValue | RgbColor, background: ColorValue | RgbColor, options: ContrastOptions = {}): ContrastResult {
  const fg: ColorValue = "format" in foreground ? foreground : { format: "rgb", value: foreground };
  const bg: ColorValue = "format" in background ? background : { format: "rgb", value: background };
  const normalizedFg = normalizeColor(fg), normalizedBg = normalizeColor(bg);
  const resolved = resolvePair(fg, bg, options.canvas);
  const effectiveForeground = publicRgb(resolved.foreground);
  const effectiveBackground = publicRgb(resolved.background);
  const firstLuminance = luminanceEncoded(resolved.foreground), secondLuminance = luminanceEncoded(resolved.background);
  const rawRatio = (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
  const criterion = options.criterion ?? "wcag-2.2-1.4.3";
  if (criterion === "wcag-2.2-1.4.11" && !options.context?.trim()) throw new InvalidColorError("Non-text evaluation requires a named graphical object or boundary", [{ code: "INVALID_COLOR", path: "/context", message: "Non-text evaluation requires a named graphical object or boundary" }]);
  if (criterion === "wcag-2.2-1.4.11" && options.textSize !== undefined) throw new InvalidColorError("textSize does not apply to non-text contrast", [{ code: "INVALID_COLOR", path: "/textSize", message: "textSize does not apply to non-text contrast" }]);
  const threshold = criterion === "wcag-2.2-1.4.11" ? 3 : options.textSize === "large" ? 3 : 4.5;
  return {
    contrastRatio: roundToTwo(rawRatio), rawContrastRatio: rawRatio,
    ...(criterion === "wcag-2.2-1.4.3" ? { wcag: getWcagResults(rawRatio) } : {}),
    criterion, threshold, passesCriterion: rawRatio >= threshold,
    textSize: criterion === "wcag-2.2-1.4.3" ? options.textSize ?? "normal" : undefined,
    context: options.context,
    compositing: COMPOSITING_MODEL,
    foreground: normalizedFg, background: normalizedBg,
    effectiveForeground, effectiveBackground,
    effectiveSrgb: {
      foreground: { r: resolved.foreground.r, g: resolved.foreground.g, b: resolved.foreground.b },
      background: { r: resolved.background.r, g: resolved.background.g, b: resolved.background.b }
    },
    canvas: options.canvas ? normalizeColor(options.canvas) : undefined
  };
}

export function analyzeColor(color: ColorValue): {
  color: ColorValue; relativeLuminance: number; isLight: boolean; isDark: boolean;
  hue?: number; saturation?: number; chroma?: number;
} {
  const normalized = normalizeColor(color);
  const srgb = colorToSrgb(color);
  if (srgb.alpha !== 1) throw new InvalidColorError("Color analysis requires an opaque color");
  const luminance = luminanceEncoded(srgb);
  const oklch = convertColor(color, "oklch").output;
  if (oklch.format !== "oklch") throw new InvalidColorError("Unable to analyze color");
  const common = { color: normalized, relativeLuminance: luminance, isLight: luminance >= 0.5, isDark: luminance < 0.5 };
  if (oklch.value.c < 1e-7) return common;
  let saturation: number | undefined;
  if (normalized.format === "hsl") saturation = normalized.value.s;
  if (normalized.format === "hsv") saturation = normalized.value.s;
  return { ...common, hue: oklch.value.h, chroma: oklch.value.c, ...(saturation === undefined ? {} : { saturation }) };
}

export function deltaEOK(first: ColorValue, second: ColorValue): number {
  const a = colorToOklab(first), b = colorToOklab(second);
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

export interface ContrastCandidate {
  direction: "lighter" | "darker"; color: ColorValue; contrastRatio: number; deltaEOK: number;
  gamutMapped: boolean; gamutMapping?: "css-color-4-local-minde";
}
export interface SuggestionOptions extends ContrastOptions { threshold?: number }
export function suggestContrastingColors(foreground: ColorValue, background: ColorValue, options: SuggestionOptions = {}): {
  candidates: ContrastCandidate[]; criterion: ContrastCriterion; threshold: number; context?: string;
  textSize?: TextSize; background: ColorValue; canvas?: ColorValue; iterationsPerDirection: number;
} {
  const criterion = options.criterion ?? "wcag-2.2-1.4.3";
  const textSize = options.textSize ?? "normal";
  const threshold = options.threshold ?? (criterion === "wcag-2.2-1.4.11" || textSize === "large" ? 3 : 4.5);
  const allowed = criterion === "wcag-2.2-1.4.11" ? [3] : textSize === "large" ? [3, 4.5] : [4.5, 7];
  if (!allowed.includes(threshold)) throw new InvalidColorError("Threshold does not apply to the selected WCAG criterion and text size");
  if (criterion === "wcag-2.2-1.4.11" && !options.context?.trim()) throw new InvalidColorError("Non-text suggestions require a named graphical object or boundary");
  if (criterion === "wcag-2.2-1.4.11" && options.textSize !== undefined) throw new InvalidColorError("textSize does not apply to non-text contrast");
  const source = convertColor(foreground, "oklch").output;
  if (source.format !== "oklch") throw new InvalidColorError("Unable to convert foreground to OKLCH");
  const candidates: ContrastCandidate[] = [];
  for (const direction of ["lighter", "darker"] as const) {
    let low = direction === "lighter" ? source.value.l : 0;
    let high = direction === "lighter" ? 1 : source.value.l;
    let found: ContrastCandidate | undefined;
    for (let i = 0; i < 24; i += 1) {
      const l = (low + high) / 2;
      const converted = convertColor({ format: "oklch", value: { ...source.value, l } }, "hex");
      const candidate = converted.output;
      const measured = analyzeContrast(candidate, background, {
        criterion, ...(criterion === "wcag-2.2-1.4.3" ? { textSize } : {}),
        ...(options.context === undefined ? {} : { context: options.context }),
        ...(options.canvas === undefined ? {} : { canvas: options.canvas })
      });
      const passes = measured.rawContrastRatio >= threshold;
      if (passes) found = {
        direction, color: candidate, contrastRatio: measured.rawContrastRatio,
        deltaEOK: deltaEOK(foreground, candidate), gamutMapped: converted.gamutMapped,
        ...(converted.gamutMapped ? { gamutMapping: converted.gamutMapping } : {})
      };
      if (direction === "lighter") {
        if (passes) high = l; else low = l;
      } else if (passes) low = l; else high = l;
    }
    if (found) candidates.push(found);
  }
  return {
    candidates: candidates.sort((a, b) => a.deltaEOK - b.deltaEOK || (a.direction < b.direction ? -1 : 1)),
    criterion, threshold, background: normalizeColor(background),
    ...(options.context === undefined ? {} : { context: options.context }),
    ...(criterion === "wcag-2.2-1.4.3" ? { textSize } : {}),
    ...(options.canvas === undefined ? {} : { canvas: normalizeColor(options.canvas) }), iterationsPerDirection: 24
  };
}
