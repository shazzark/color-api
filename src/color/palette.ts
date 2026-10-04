import type { HslColor, PaletteStrategy } from "./types.js";
import { InvalidColorError } from "./validation.js";

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

function withHueOffsets(
  base: HslColor,
  offsets: number[]
): HslColor[] {
  return offsets.map((offset) => ({
    h: normalizeHue(base.h + offset),
    s: base.s,
    l: base.l,
    ...(base.alpha === undefined ? {} : { alpha: base.alpha })
  }));
}

function monochromaticLightness(lightness: number): number[] {
  if (lightness === 0 || lightness === 100) {
    return [0, 25, 50, 75, 100];
  }

  return [
    0,
    lightness / 2,
    lightness,
    (lightness + 100) / 2,
    100
  ];
}

function generateMonochromatic(base: HslColor): HslColor[] {
  return monochromaticLightness(base.l).map((lightness) => ({
    h: base.h,
    s: base.s,
    l: lightness,
    ...(base.alpha === undefined ? {} : { alpha: base.alpha })
  }));
}

export function generateHslPalette(
  base: HslColor,
  strategy: PaletteStrategy,
  options: { count?: number } = {}
): HslColor[] {
  const count = options.count;
  if (count !== undefined && (strategy !== "analogous" || !Number.isInteger(count) || count < 2 || count > 12)) {
    throw new InvalidColorError("A configurable count from 2 to 12 is supported for analogous palettes only");
  }
  switch (strategy) {
    case "complementary":
      return withHueOffsets(base, [0, 180]);
    case "analogous":
      return withHueOffsets(base, count === undefined
        ? [-30, 0, 30]
        : Array.from({ length: count }, (_, index) => -30 + index * 60 / (count - 1)));
    case "triadic":
      return withHueOffsets(base, [0, 120, 240]);
    case "tetradic":
      return withHueOffsets(base, [0, 90, 180, 270]);
    case "split-complementary":
      return withHueOffsets(base, [0, 150, 210]);
    case "monochromatic":
      return generateMonochromatic(base);
  }
}
