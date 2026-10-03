import type {
  ColorFormat, ColorValue, HexColor, HslColor, HsvColor, OklabColor,
  OklchColor, RgbColor, ValidationIssue
} from "./types.js";

export class InvalidColorError extends Error {
  public readonly code = "INVALID_COLOR";
  public readonly issues: ValidationIssue[];
  public constructor(message: string, issues?: ValidationIssue[]) {
    super(message);
    this.name = "InvalidColorError";
    this.issues = issues ?? [{ code: "INVALID_COLOR", path: "/value", message }];
  }
}

export class InvalidRequestError extends Error {
  public readonly code = "INVALID_REQUEST";
  public constructor(message: string) { super(message); this.name = "InvalidRequestError"; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function fail(format: string, path = "/value"): never {
  const message = `Invalid ${format} color value`;
  throw new InvalidColorError(message, [{ code: "INVALID_COLOR", path, message }]);
}
function hue(value: unknown, path: string): number {
  if (!finite(value)) fail("hue", path);
  const normalized = ((value % 360) + 360) % 360;
  return Object.is(normalized, -0) ? 0 : normalized;
}
function alpha(value: Record<string, unknown>, format: string): number | undefined {
  if (!("alpha" in value)) return undefined;
  if (!finite(value.alpha) || value.alpha < 0 || value.alpha > 1) fail(format, "/value/alpha");
  return value.alpha === 1 ? undefined : Object.is(value.alpha, -0) ? 0 : value.alpha;
}
function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

export function validateHexColor(value: unknown): HexColor {
  if (typeof value !== "string") fail("HEX");
  const digits = value.startsWith("#") ? value.slice(1) : value;
  if (!/^(?:[\da-fA-F]{6}|[\da-fA-F]{8})$/.test(digits)) fail("HEX");
  const canonical = digits.toLowerCase();
  return `#${canonical.length === 8 && canonical.slice(6) === "ff" ? canonical.slice(0, 6) : canonical}`;
}
function structured(value: unknown, format: string, keys: string[]): Record<string, number> {
  if (!isRecord(value) || !exactKeys(value, [...keys, "alpha"])) fail(format);
  for (const key of keys) if (!finite(value[key])) fail(format, `/value/${key}`);
  const a = alpha(value, format);
  const result: Record<string, number> = {};
  for (const key of keys) {
    const field = value[key];
    if (!finite(field)) fail(format, `/value/${key}`);
    result[key] = Object.is(field, -0) ? 0 : field;
  }
  if (a !== undefined) result.alpha = a;
  return result;
}
export function validateRgbColor(value: unknown): RgbColor {
  const fields = structured(value, "RGB", ["r", "g", "b"]);
  const result: RgbColor = { r: fields.r, g: fields.g, b: fields.b, ...(fields.alpha === undefined ? {} : { alpha: fields.alpha }) };
  if (![result.r, result.g, result.b].every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) fail("RGB");
  return result;
}
export function validateHslColor(value: unknown): HslColor {
  const fields = structured(value, "HSL", ["h", "s", "l"]);
  const result: HslColor = { h: fields.h, s: fields.s, l: fields.l, ...(fields.alpha === undefined ? {} : { alpha: fields.alpha }) };
  if (result.s < 0 || result.s > 100 || result.l < 0 || result.l > 100) fail("HSL");
  return { ...result, h: result.s === 0 || result.l === 0 || result.l === 100 ? 0 : hue(result.h, "/value/h") };
}
export function validateHsvColor(value: unknown): HsvColor {
  const fields = structured(value, "HSV", ["h", "s", "v"]);
  const result: HsvColor = { h: fields.h, s: fields.s, v: fields.v, ...(fields.alpha === undefined ? {} : { alpha: fields.alpha }) };
  if (result.s < 0 || result.s > 100 || result.v < 0 || result.v > 100) fail("HSV");
  return { ...result, h: result.s === 0 || result.v === 0 ? 0 : hue(result.h, "/value/h") };
}
export function validateOklabColor(value: unknown): OklabColor {
  const fields = structured(value, "OKLab", ["l", "a", "b"]);
  const result: OklabColor = { l: fields.l, a: fields.a, b: fields.b, ...(fields.alpha === undefined ? {} : { alpha: fields.alpha }) };
  if (result.l < 0 || result.l > 1) fail("OKLab", "/value/l");
  return result;
}
export function validateOklchColor(value: unknown): OklchColor {
  const fields = structured(value, "OKLCH", ["l", "c", "h"]);
  const result: OklchColor = { l: fields.l, c: fields.c, h: fields.h, ...(fields.alpha === undefined ? {} : { alpha: fields.alpha }) };
  if (result.l < 0 || result.l > 1) fail("OKLCH", "/value/l");
  if (result.c < 0) fail("OKLCH", "/value/c");
  return { ...result, h: result.c === 0 ? 0 : hue(result.h, "/value/h") };
}

export function isColorFormat(value: string): value is ColorFormat {
  return value === "hex" || value === "rgb" || value === "hsl" || value === "hsv" || value === "oklab" || value === "oklch";
}
export function validateColorValue(format: ColorFormat, value: unknown): ColorValue {
  switch (format) {
    case "hex": return { format, value: validateHexColor(value) };
    case "rgb": return { format, value: validateRgbColor(value) };
    case "hsl": return { format, value: validateHslColor(value) };
    case "hsv": return { format, value: validateHsvColor(value) };
    case "oklab": return { format, value: validateOklabColor(value) };
    case "oklch": return { format, value: validateOklchColor(value) };
  }
}
export function validateColorInput(input: unknown): ColorValue {
  if (!isRecord(input) || !exactKeys(input, ["format", "value"]) || typeof input.format !== "string" || !isColorFormat(input.format) || !("value" in input)) {
    throw new InvalidColorError("Invalid color envelope", [{ code: "INVALID_COLOR", path: "/", message: "Invalid color envelope" }]);
  }
  return validateColorValue(input.format, input.value);
}
export function normalizeColor(input: unknown): ColorValue {
  const color = validateColorInput(input);
  const r = (value: number, places: number): number => {
    const result = Math.round(value * 10 ** places) / 10 ** places;
    return Object.is(result, -0) ? 0 : result;
  };
  const roundedHue = (value: number, places: number): number => {
    const rounded = r(value, places);
    return rounded >= 360 ? 0 : rounded;
  };
  const normalizedAlpha = (value: number | undefined): { alpha?: number } => {
    if (value === undefined) return {};
    const rounded = r(value, 4);
    return rounded >= 1 ? {} : { alpha: rounded };
  };
  switch (color.format) {
    case "hex": return color;
    case "rgb": return { format: "rgb", value: { r: color.value.r, g: color.value.g, b: color.value.b, ...normalizedAlpha(color.value.alpha) } };
    case "hsl": {
      const s = r(color.value.s, 2), l = r(color.value.l, 2);
      return { format: "hsl", value: { h: s === 0 || l === 0 || l === 100 ? 0 : roundedHue(color.value.h, 2), s, l, ...normalizedAlpha(color.value.alpha) } };
    }
    case "hsv": {
      const s = r(color.value.s, 2), v = r(color.value.v, 2);
      return { format: "hsv", value: { h: s === 0 || v === 0 ? 0 : roundedHue(color.value.h, 2), s, v, ...normalizedAlpha(color.value.alpha) } };
    }
    case "oklab": return { format: "oklab", value: { l: r(color.value.l, 4), a: r(color.value.a, 4), b: r(color.value.b, 4), ...normalizedAlpha(color.value.alpha) } };
    case "oklch": {
      const c = r(color.value.c, 4);
      return { format: "oklch", value: { l: r(color.value.l, 4), c, h: c === 0 ? 0 : roundedHue(color.value.h, 4), ...normalizedAlpha(color.value.alpha) } };
    }
  }
}
export function validateColor(input: unknown):
  | { valid: true; color: ColorValue }
  | { valid: false; errors: ValidationIssue[] } {
  try { return { valid: true, color: normalizeColor(input) }; }
  catch (error: unknown) {
    if (error instanceof InvalidColorError) return { valid: false, errors: error.issues };
    return { valid: false, errors: [{ code: "INVALID_COLOR", path: "/", message: "Invalid color envelope" }] };
  }
}
export function detectColorFormat(input: unknown): ColorFormat | undefined {
  if (isRecord(input) && typeof input.format === "string" && isColorFormat(input.format)) return input.format;
  if (typeof input === "string" && /^#[\da-fA-F]{6}(?:[\da-fA-F]{2})?$/.test(input)) return "hex";
  return undefined;
}
export function validateTokenName(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z][a-z0-9-]*$/.test(value)) throw new InvalidRequestError("Invalid token name");
  return value;
}
