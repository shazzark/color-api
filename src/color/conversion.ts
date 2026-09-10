import type { HexColor, HslColor, HsvColor, RgbColor } from "./types.js";

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

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: roundToTwo(lightness * 100) };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;

  if (max === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) {
    hue += 360;
  }

  return {
    h: roundToTwo(hue),
    s: roundToTwo(saturation * 100),
    l: roundToTwo(lightness * 100)
  };
}

export function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, v: roundToTwo(max * 100) };
  }

  const saturation = delta / max;
  let hue: number;

  if (max === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) {
    hue += 360;
  }

  return {
    h: roundToTwo(hue),
    s: roundToTwo(saturation * 100),
    v: roundToTwo(max * 100)
  };
}

export function hexToHsl(value: HexColor): HslColor {
  return rgbToHsl(hexToRgb(value));
}

export function hexToHsv(value: HexColor): HsvColor {
  return rgbToHsv(hexToRgb(value));
}
