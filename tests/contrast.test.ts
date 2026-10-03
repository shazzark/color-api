import { describe, expect, it } from "vitest";
import {
  analyzeColor,
  analyzeContrast,
  compositeColors,
  contrastRatio,
  deltaEOK,
  getWcagResults,
  relativeLuminance,
  suggestContrastingColors
} from "../src/color/contrast.js";
import { hexToRgb, hslToRgb, hsvToRgb } from "../src/color/conversion.js";

describe("relativeLuminance", () => {
  it("calculates black luminance", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it("calculates white luminance", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBe(1);
  });
});

describe("contrastRatio", () => {
  it("calculates black and white contrast as 21", () => {
    expect(contrastRatio(
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 }
    )).toBe(21);
  });

  it("is symmetric regardless of color order", () => {
    const white = { r: 255, g: 255, b: 255 };
    const gray = { r: 119, g: 119, b: 119 };

    expect(contrastRatio(white, gray)).toBe(contrastRatio(gray, white));
  });

  it("matches the known #777777 and white result", () => {
    const result = analyzeContrast(
      { r: 119, g: 119, b: 119 },
      { r: 255, g: 255, b: 255 }
    );

    expect(result.contrastRatio).toBe(4.48);
    expect(result.wcag).toEqual({
      normalText: { aa: false, aaa: false },
      largeText: { aa: true, aaa: false }
    });
  });

  it("rounds only the exposed ratio", () => {
    const rawRatio = contrastRatio(
      { r: 119, g: 119, b: 119 },
      { r: 255, g: 255, b: 255 }
    );

    expect(rawRatio).not.toBe(4.48);
    expect(analyzeContrast(
      { r: 119, g: 119, b: 119 },
      { r: 255, g: 255, b: 255 }
    ).contrastRatio).toBe(4.48);
  });
});

describe("WCAG thresholds", () => {
  it("evaluates normal text AA and AAA thresholds", () => {
    expect(getWcagResults(4.49).normalText).toEqual({ aa: false, aaa: false });
    expect(getWcagResults(4.5).normalText).toEqual({ aa: true, aaa: false });
    expect(getWcagResults(7).normalText).toEqual({ aa: true, aaa: true });
  });

  it("evaluates large text AA and AAA thresholds", () => {
    expect(getWcagResults(2.99).largeText).toEqual({ aa: false, aaa: false });
    expect(getWcagResults(3).largeText).toEqual({ aa: true, aaa: false });
    expect(getWcagResults(4.5).largeText).toEqual({ aa: true, aaa: true });
  });
});

describe("equivalent color representations", () => {
  it("produces the same analysis for HEX, RGB, HSL, and HSV", () => {
    const colors = [
      hexToRgb("#ffffff"),
      { r: 255, g: 255, b: 255 },
      hslToRgb({ h: 0, s: 0, l: 100 }),
      hsvToRgb({ h: 0, s: 0, v: 100 })
    ];

    for (const foreground of colors) {
      expect(analyzeContrast(foreground, { r: 0, g: 0, b: 0 }).contrastRatio)
        .toBe(21);
    }
  });

  it("handles achromatic colors", () => {
    expect(analyzeContrast(
      hslToRgb({ h: 120, s: 0, l: 50 }),
      hsvToRgb({ h: 240, s: 0, v: 0 })
    ).contrastRatio).toBe(5.32);
  });
});

describe("alpha-aware contrast context", () => {
  it("composites translucent foreground over opaque background in encoded sRGB", () => {
    expect(compositeColors(
      { format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 0.5 } },
      { format: "hex", value: "#ffffff" }
    )).toEqual({ format: "rgb", value: { r: 255, g: 128, b: 128 } });
    expect(compositeColors(
      { format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 0 } },
      { format: "hex", value: "#123456" }
    )).toEqual({ format: "rgb", value: { r: 18, g: 52, b: 86 } });
    expect(compositeColors(
      { format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 1 } },
      { format: "hex", value: "#123456" }
    )).toEqual({ format: "rgb", value: { r: 255, g: 0, b: 0 } });
  });

  it("requires and records an opaque canvas for a translucent background", () => {
    const foreground = { format: "hex" as const, value: "#000000" };
    const background = { format: "rgb" as const, value: { r: 0, g: 0, b: 0, alpha: 0.5 } };
    expect(() => analyzeContrast(foreground, background)).toThrow("opaque canvas");
    const result = analyzeContrast(foreground, background, { canvas: { format: "hex", value: "#ffffff" } });
    expect(result.effectiveBackground).toEqual({ format: "rgb", value: { r: 128, g: 128, b: 128 } });
    expect(result.effectiveForeground).toEqual({ format: "rgb", value: { r: 0, g: 0, b: 0 } });
    expect(result.compositing).toBe("css-srgb-source-over");
    expect(result.canvas).toEqual({ format: "hex", value: "#ffffff" });
    expect(result.effectiveSrgb.background.r).toBeLessThan(0.5);
    expect(result.contrastRatio).toBe(5.28);
  });

  it("rejects a translucent canvas and requires a context for non-text evaluation", () => {
    const fg = { format: "hex" as const, value: "#000000" };
    const bg = { format: "hex" as const, value: "#ffffff" };
    expect(() => analyzeContrast(fg, bg, { canvas: { format: "rgb", value: { r: 255, g: 255, b: 255, alpha: 0.5 } } })).toThrow("Canvas color must be opaque");
    expect(() => analyzeContrast(fg, bg, { criterion: "wcag-2.2-1.4.11" })).toThrow("graphical object or boundary");
    const nonText = analyzeContrast(fg, bg, { criterion: "wcag-2.2-1.4.11", context: "icon boundary" });
    expect(nonText).toMatchObject({ criterion: "wcag-2.2-1.4.11", threshold: 3, passesCriterion: true, context: "icon boundary" });
    expect(nonText).not.toHaveProperty("wcag");
  });

  it("evaluates caller-asserted large text against its threshold without ratio rounding", () => {
    const text = { format: "hex" as const, value: "#777777" };
    const white = { format: "hex" as const, value: "#ffffff" };
    const normal = analyzeContrast(text, white);
    const large = analyzeContrast(text, white, { textSize: "large" });
    expect(normal.rawContrastRatio).toBeLessThan(4.5);
    expect(normal.threshold).toBe(4.5);
    expect(normal.passesCriterion).toBe(false);
    expect(large.threshold).toBe(3);
    expect(large.passesCriterion).toBe(true);
    expect(analyzeContrast({ format: "hex", value: "#777777" }, white).wcag?.normalText.aa).toBe(false);
  });
});

describe("color metrics and suggestions", () => {
  it("returns luminance classification and omits hue for achromatic colors", () => {
    expect(analyzeColor({ format: "hex", value: "#ffffff" })).toMatchObject({ isLight: true, isDark: false, relativeLuminance: 1 });
    expect(analyzeColor({ format: "hex", value: "#808080" })).not.toHaveProperty("hue");
    expect(analyzeColor({ format: "hex", value: "#ff0000" })).toHaveProperty("chroma");
    expect(() => analyzeColor({ format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 0.5 } })).toThrow("opaque color");
  });

  it("calculates named Euclidean OKLab deltaEOK", () => {
    expect(deltaEOK({ format: "hex", value: "#ff0000" }, { format: "hex", value: "#ff0000" })).toBe(0);
    expect(deltaEOK({ format: "hex", value: "#000000" }, { format: "hex", value: "#ffffff" })).toBeCloseTo(1, 3);
  });

  it("returns deterministic bounded candidates that meet the requested ratio", () => {
    const input = { format: "hex" as const, value: "#777777" };
    const background = { format: "hex" as const, value: "#ffffff" };
    const first = suggestContrastingColors(input, background, { threshold: 7 });
    const second = suggestContrastingColors(input, background, { threshold: 7 });
    expect(first).toEqual(second);
    expect(first.iterationsPerDirection).toBe(24);
    expect(first.candidates).toHaveLength(1);
    expect(first.candidates[0].direction).toBe("darker");
    expect(first.candidates[0].contrastRatio).toBeGreaterThanOrEqual(7);
  });

  it("reports no candidates when neither fixed-hue direction can meet the requested threshold", () => {
    const result = suggestContrastingColors(
      { format: "hex", value: "#777777" }, { format: "hex", value: "#777777" }, { threshold: 7 }
    );
    expect(result.candidates).toEqual([]);
    expect(result.criterion).toBe("wcag-2.2-1.4.3");
    expect(result.textSize).toBe("normal");
  });

  it("returns criterion-scoped non-text candidates with translucent backdrop context", () => {
    const result = suggestContrastingColors(
      { format: "hex", value: "#777777" },
      { format: "rgb", value: { r: 0, g: 0, b: 0, alpha: 0.5 } },
      { criterion: "wcag-2.2-1.4.11", context: "icon boundary", canvas: { format: "hex", value: "#ffffff" } }
    );
    expect(result).toMatchObject({ criterion: "wcag-2.2-1.4.11", threshold: 3, context: "icon boundary", canvas: { format: "hex", value: "#ffffff" } });
    for (const candidate of result.candidates) {
      expect(candidate.contrastRatio).toBeGreaterThanOrEqual(3);
      expect(analyzeContrast(candidate.color, result.background, { criterion: result.criterion, context: result.context, canvas: result.canvas }).passesCriterion).toBe(true);
    }
  });

  it("rechecks mapped high-chroma candidates against the actual sRGB output", () => {
    const result = suggestContrastingColors(
      { format: "oklch", value: { l: 0.6, c: 0.4, h: 30 } },
      { format: "hex", value: "#000000" },
      { threshold: 4.5 }
    );
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.some((candidate) => candidate.gamutMapped)).toBe(true);
    for (const candidate of result.candidates) {
      expect(candidate.color.format).toBe("hex");
      expect(analyzeContrast(candidate.color, result.background).rawContrastRatio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("validates direct RGB luminance inputs", () => {
    expect(() => relativeLuminance({ r: -1, g: 0, b: 0 })).toThrow("integer sRGB channels");
    expect(() => relativeLuminance({ r: 0.5, g: 0, b: 0 })).toThrow("integer sRGB channels");
    expect(() => relativeLuminance({ r: 0, g: 0, b: 0, alpha: 0.5 })).toThrow("opaque color");
  });
});
