import type { HexColor, RgbColor } from "./types.js";

export class InvalidColorError extends Error {
  public readonly code = "INVALID_COLOR";

  public constructor(message: string) {
    super(message);
    this.name = "InvalidColorError";
  }
}

export function hexToRgb(value: HexColor): RgbColor {
  const normalized = value.startsWith("#") ? value.slice(1) : value;

  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    throw new InvalidColorError("Invalid HEX color value");
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}
