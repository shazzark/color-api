import type { HslColor, PaletteStrategy } from "./types.js";

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
    l: base.l
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
    l: lightness
  }));
}

export function generateHslPalette(
  base: HslColor,
  strategy: PaletteStrategy
): HslColor[] {
  switch (strategy) {
    case "complementary":
      return withHueOffsets(base, [0, 180]);
    case "analogous":
      return withHueOffsets(base, [-30, 0, 30]);
    case "triadic":
      return withHueOffsets(base, [0, 120, 240]);
    case "split-complementary":
      return withHueOffsets(base, [0, 150, 210]);
    case "monochromatic":
      return generateMonochromatic(base);
  }
}