import { describe, expect, it } from "vitest";
import { generateHslPalette } from "../src/color/palette.js";
import { colorToSrgb, convertColor, srgbChannelsToColor } from "../src/color/conversion.js";
import type { ColorValue } from "../src/color/types.js";
import {
  adjustAlpha, adjustChroma, adjustLightness, adjustSaturation, generateColors,
  generateOklchScale, generateShades, generateTints, generateTones, grayscaleColor,
  invertColor, mixColors, rotateHue
} from "../src/color/operations.js";

describe("seeded and bounded color generation", () => {
  it("pins mulberry32-v1 output for a string seed", () => {
    expect(generateColors(2, { seed: "phase4" })).toEqual({
      algorithm: "mulberry32-v1", seed: "phase4", colors: [
        { format: "oklch", value: { l: 0.27679770323447883, c: 0.3760412437841296, h: 159.2664078064263 } },
        { format: "oklch", value: { l: 0.9556140995118767, c: 0.10790915377438069, h: 225.13081678189337 } }
      ]
    });
  });

  it("repeats seeded batches and applies closed bounds/count limits", () => {
    expect(generateColors(5, { seed: 42 })).toEqual(generateColors(5, { seed: 42 }));
    const result = generateColors(25, { seed: 1, constraints: { lightness: [0.4, 0.5], chroma: [0.1, 0.2], hue: [20, 30] } });
    expect(result.algorithm).toBe("mulberry32-v1");
    expect(result.colors).toHaveLength(25);
    for (const color of result.colors) {
      if (color.format !== "oklch") throw new Error("Unexpected generated format");
      expect(color.value.l).toBeGreaterThanOrEqual(0.4);
      expect(color.value.l).toBeLessThanOrEqual(0.5);
      expect(color.value.c).toBeGreaterThanOrEqual(0.1);
      expect(color.value.c).toBeLessThanOrEqual(0.2);
      expect(color.value.h).toBeGreaterThanOrEqual(20);
      expect(color.value.h).toBeLessThanOrEqual(30);
    }
    expect(generateColors(1).algorithm).toBe("Math.random");
    expect(() => generateColors(0)).toThrow("count");
    expect(() => generateColors(1, { seed: 0.5 })).toThrow("safe integer");
    expect(() => generateColors(2, { constraints: { chroma: [0.3, 0.2] } })).toThrow("constraint");
    expect(() => Reflect.apply(generateColors, undefined, [1, null])).toThrow("options");
    expect(() => Reflect.apply(generateColors, undefined, [1, { constraints: null }])).toThrow("Constraints");
  });
});

describe("OKLCH manipulations and mixing", () => {
  const base = { format: "oklch" as const, value: { l: 0.6, c: 0.1, h: 350, alpha: 0.8 } };

  it("wraps hue, clamps lightness/chroma, and changes saturation in named OKLCH terms", () => {
    expect(rotateHue(base, 30)).toEqual({ format: "oklch", value: { l: 0.6, c: 0.1, h: 20, alpha: 0.8 } });
    expect(adjustLightness(base, 0.6)).toMatchObject({ format: "oklch", value: { l: 1 } });
    expect(adjustChroma(base, -0.2)).toMatchObject({ format: "oklch", value: { c: 0 } });
    expect(adjustSaturation(base, 0.5)).toMatchObject({ format: "oklch", value: { c: 0.15 } });
    expect(grayscaleColor(base)).toMatchObject({ format: "oklch", value: { c: 0, h: 0, alpha: 0.8 } });
    expect(adjustAlpha(base, 0)).toMatchObject({ format: "oklch", value: { alpha: 0 } });
    expect(adjustChroma({ format: "oklch", value: { l: 0.5, c: 0.12344, h: 20 } }, 0.00004))
      .toEqual({ format: "oklch", value: { l: 0.5, c: 0.1235, h: 20 } });
  });

  it("inverts encoded sRGB and mixes with premultiplied alpha", () => {
    expect(invertColor({ format: "hex", value: "#123456" })).toEqual({ format: "hex", value: "#edcba9" });
    const precise: ColorValue = { format: "oklch", value: { l: 0.62345, c: 0.12345, h: 47.1234, alpha: 0.6 } };
    const srgb = colorToSrgb(precise);
    expect(invertColor(precise)).toEqual(srgbChannelsToColor(1 - srgb.r, 1 - srgb.g, 1 - srgb.b, srgb.alpha, "oklch"));
    const result = mixColors(
      { format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 0 } },
      { format: "rgb", value: { r: 0, g: 0, b: 255 } },
      0.5
    );
    expect(result).toMatchObject({ format: "oklab", value: { alpha: 0.5 } });
    expect(mixColors({ format: "hex", value: "#ff0000" }, { format: "hex", value: "#0000ff" }, 0)).toEqual({
      format: "oklab", value: { l: 0.628, a: 0.2249, b: 0.1258 }
    });
    expect(() => mixColors(base, base, 1.1)).toThrow("weight");
  });
});

describe("harmony palettes and OKLCH scales", () => {
  it("adds tetradic harmony and configurable analogous counts", () => {
    expect(generateHslPalette({ h: 10, s: 40, l: 50 }, "tetradic").map(({ h }) => h)).toEqual([10, 100, 190, 280]);
    expect(generateHslPalette({ h: 350, s: 40, l: 50 }, "analogous", { count: 5 }).map(({ h }) => h)).toEqual([320, 335, 350, 5, 20]);
    expect(() => generateHslPalette({ h: 10, s: 40, l: 50 }, "triadic", { count: 4 })).toThrow("analogous");
  });

  it("samples explicit, monotonic stops in order and reports gamut mapping", () => {
    const stops = [
      { position: 0, color: { format: "oklch" as const, value: { l: 0.2, c: 0.05, h: 20 } } },
      { position: 0.6, color: { format: "oklch" as const, value: { l: 0.6, c: 0.2, h: 40 } } },
      { position: 1, color: { format: "oklch" as const, value: { l: 0.9, c: 0.1, h: 60 } } }
    ];
    const scale = generateOklchScale(stops, 6);
    expect(scale.map(({ position }) => position)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(scale.every((entry) => entry.output.format === "hex")).toBe(true);
    expect(scale[0].output).toEqual(convertColor(stops[0].color, "hex").output);
    expect(() => generateOklchScale([...stops].reverse(), 5)).toThrow();
    expect(() => generateOklchScale([
      { position: 0, color: { format: "oklch", value: { l: 0.2, c: 0.1, h: 30, alpha: 0 } } },
      { position: 1, color: { format: "oklch", value: { l: 0.8, c: 0.1, h: 30, alpha: 1 } } }
    ], 3)).toThrow("same alpha");
    const mapped = generateOklchScale([
      { position: 0, color: { format: "oklch", value: { l: 0.6, c: 0.4, h: 30 } } },
      { position: 1, color: { format: "oklch", value: { l: 0.8, c: 0.4, h: 30 } } }
    ], 3);
    expect(mapped.some((entry) => entry.gamutMapped)).toBe(true);
  });

  it("generates ordered perceptual shades, tints, and tones", () => {
    const input = { format: "hex" as const, value: "#3498db" };
    const shades = generateShades(input, 5), tints = generateTints(input, 5), tones = generateTones(input, 5);
    expect(shades[0].output).toEqual({ format: "hex", value: "#3498db" });
    expect(shades[4].output).toEqual({ format: "hex", value: "#000000" });
    expect(tints[0].output).toEqual({ format: "hex", value: "#3498db" });
    expect(tints[4].output).toEqual({ format: "hex", value: "#ffffff" });
    expect(tones[4].output.format).toBe("hex");
  });
});
