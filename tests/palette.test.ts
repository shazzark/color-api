import { describe, expect, it } from "vitest";
import { generateHslPalette } from "../src/color/palette.js";
import type { HslColor, PaletteStrategy } from "../src/color/types.js";

const base: HslColor = { h: 350, s: 60, l: 40 };

const expectedStrategies: Array<{
  strategy: PaletteStrategy;
  colors: HslColor[];
}> = [
  {
    strategy: "complementary",
    colors: [
      { h: 350, s: 60, l: 40 },
      { h: 170, s: 60, l: 40 }
    ]
  },
  {
    strategy: "analogous",
    colors: [
      { h: 320, s: 60, l: 40 },
      { h: 350, s: 60, l: 40 },
      { h: 20, s: 60, l: 40 }
    ]
  },
  {
    strategy: "triadic",
    colors: [
      { h: 350, s: 60, l: 40 },
      { h: 110, s: 60, l: 40 },
      { h: 230, s: 60, l: 40 }
    ]
  },
  {
    strategy: "split-complementary",
    colors: [
      { h: 350, s: 60, l: 40 },
      { h: 140, s: 60, l: 40 },
      { h: 200, s: 60, l: 40 }
    ]
  }
];

describe("generateHslPalette", () => {
  it.each(expectedStrategies)("generates $strategy hue offsets", ({ strategy, colors }) => {
    expect(generateHslPalette(base, strategy)).toEqual(colors);
  });

  it("generates the interior monochromatic lightness scale", () => {
    expect(generateHslPalette({ h: 120, s: 50, l: 40 }, "monochromatic"))
      .toEqual([
        { h: 120, s: 50, l: 0 },
        { h: 120, s: 50, l: 20 },
        { h: 120, s: 50, l: 40 },
        { h: 120, s: 50, l: 70 },
        { h: 120, s: 50, l: 100 }
      ]);
  });

  it.each([0, 100])("uses the boundary monochromatic scale at l=%s", (lightness) => {
    const palette = generateHslPalette(
      { h: 120, s: 50, l: lightness },
      "monochromatic"
    );

    expect(palette).toEqual([
        { h: 120, s: 50, l: 0 },
        { h: 120, s: 50, l: 25 },
        { h: 120, s: 50, l: 50 },
        { h: 120, s: 50, l: 75 },
        { h: 120, s: 50, l: 100 }
      ]);
    expect(new Set(palette.map((color) => color.l)).size).toBe(5);
  });

  it("keeps monochromatic lightness values ordered and unique", () => {
    const palette = generateHslPalette({ h: 10, s: 0, l: 1 }, "monochromatic");
    const lightness = palette.map((color) => color.l);

    expect(lightness).toEqual([0, 0.5, 1, 50.5, 100]);
    expect(new Set(lightness).size).toBe(5);
  });

  it("normalizes hue wrapping around zero and 360", () => {
    expect(generateHslPalette({ h: 5, s: 40, l: 50 }, "analogous").map((color) => color.h))
      .toEqual([335, 5, 35]);
    expect(generateHslPalette({ h: 359, s: 40, l: 50 }, "triadic").map((color) => color.h))
      .toEqual([359, 119, 239]);
  });

  it("preserves saturation and lightness for hue strategies", () => {
    for (const { strategy } of expectedStrategies) {
      expect(generateHslPalette(base, strategy).every((color) =>
        color.s === base.s && color.l === base.l
      )).toBe(true);
    }
  });

  it("preserves hue and saturation for monochromatic palettes", () => {
    expect(generateHslPalette(base, "monochromatic").every((color) =>
      color.h === base.h && color.s === base.s
    )).toBe(true);
  });

  it("returns the fixed output lengths", () => {
    expect(generateHslPalette(base, "complementary")).toHaveLength(2);
    expect(generateHslPalette(base, "analogous")).toHaveLength(3);
    expect(generateHslPalette(base, "triadic")).toHaveLength(3);
    expect(generateHslPalette(base, "split-complementary")).toHaveLength(3);
    expect(generateHslPalette(base, "monochromatic")).toHaveLength(5);
  });
});
