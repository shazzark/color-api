import { describe, expect, it } from "vitest";
import {
  analyzeContrast,
  contrastRatio,
  getWcagResults,
  relativeLuminance
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