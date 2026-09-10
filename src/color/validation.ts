import type {
  ColorFormat,
  ColorValue,
  HexColor,
  HslColor,
  HsvColor,
  RgbColor
} from "./types.js";

export class InvalidColorError extends Error {
  public readonly code = "INVALID_COLOR";

  public constructor(message: string) {
    super(message);
    this.name = "InvalidColorError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFiniteNumber(
  value: Record<string, unknown>,
  key: string,
  format: string
): number {
  const channel = value[key];

  if (typeof channel !== "number" || !Number.isFinite(channel)) {
    throw new InvalidColorError(`Invalid ${format} color value`);
  }

  return channel;
}

function normalizeHue(hue: number): number {
  if (hue >= 0 && hue < 360) {
    return hue;
  }

  return ((hue % 360) + 360) % 360;
}

export function validateHexColor(value: unknown): HexColor {
  if (typeof value !== "string") {
    throw new InvalidColorError("Invalid HEX color value");
  }

  const normalized = value.startsWith("#") ? value.slice(1) : value;

  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    throw new InvalidColorError("Invalid HEX color value");
  }

  return value;
}

export function validateRgbColor(value: unknown): RgbColor {
  if (!isRecord(value)) {
    throw new InvalidColorError("Invalid RGB color value");
  }

  const red = readFiniteNumber(value, "r", "RGB");
  const green = readFiniteNumber(value, "g", "RGB");
  const blue = readFiniteNumber(value, "b", "RGB");

  if (![red, green, blue].every((channel) => Number.isInteger(channel)
    && channel >= 0
    && channel <= 255)) {
    throw new InvalidColorError("Invalid RGB color value");
  }

  return { r: red, g: green, b: blue };
}

export function validateHslColor(value: unknown): HslColor {
  if (!isRecord(value)) {
    throw new InvalidColorError("Invalid HSL color value");
  }

  const hue = readFiniteNumber(value, "h", "HSL");
  const saturation = readFiniteNumber(value, "s", "HSL");
  const lightness = readFiniteNumber(value, "l", "HSL");

  if (saturation < 0 || saturation > 100
    || lightness < 0 || lightness > 100) {
    throw new InvalidColorError("Invalid HSL color value");
  }

  return { h: normalizeHue(hue), s: saturation, l: lightness };
}

export function validateHsvColor(value: unknown): HsvColor {
  if (!isRecord(value)) {
    throw new InvalidColorError("Invalid HSV color value");
  }

  const hue = readFiniteNumber(value, "h", "HSV");
  const saturation = readFiniteNumber(value, "s", "HSV");
  const brightness = readFiniteNumber(value, "v", "HSV");

  if (saturation < 0 || saturation > 100
    || brightness < 0 || brightness > 100) {
    throw new InvalidColorError("Invalid HSV color value");
  }

  return { h: normalizeHue(hue), s: saturation, v: brightness };
}

export function isColorFormat(value: string): value is ColorFormat {
  return value === "hex"
    || value === "rgb"
    || value === "hsl"
    || value === "hsv";
}

export function validateColorValue(
  format: ColorFormat,
  value: unknown
): ColorValue {
  switch (format) {
    case "hex":
      return { format, value: validateHexColor(value) };
    case "rgb":
      return { format, value: validateRgbColor(value) };
    case "hsl":
      return { format, value: validateHslColor(value) };
    case "hsv":
      return { format, value: validateHsvColor(value) };
  }
}

export class InvalidRequestError extends Error {
  public readonly code = "INVALID_REQUEST";

  public constructor(message: string) {
    super(message);
    this.name = "InvalidRequestError";
  }
}

export function validateTokenName(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new InvalidRequestError("Invalid token name");
  }

  return value;
}