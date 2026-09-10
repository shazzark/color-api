import { describe, expect, it } from "vitest";
import {
  hexToHsl,
  hexToHsv,
  hexToRgb,
  InvalidColorError,
  rgbToHsl,
  rgbToHsv
} from "../src/color/conversion.js";

describe("hexToRgb", () => {
  it("converts a six-digit HEX value", () => {
    expect(hexToRgb("#3498db")).toEqual({ r: 52, g: 152, b: 219 });
  });

  it("accepts uppercase HEX without a hash", () => {
    expect(hexToRgb("FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("converts black", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("rejects invalid HEX values", () => {
    expect(() => hexToRgb("#12fg45")).toThrow(InvalidColorError);
    expect(() => hexToRgb("#123")).toThrow(InvalidColorError);
  });
});

describe("rgbToHsl", () => {
  it("converts a mixed RGB value", () => {
    expect(rgbToHsl({ r: 52, g: 152, b: 219 })).toEqual({
      h: 204.07,
      s: 69.87,
      l: 53.14
    });
  });

  it("converts achromatic values with zero hue and saturation", () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({
      h: 0,
      s: 0,
      l: 50.2
    });
  });
});

describe("rgbToHsv", () => {
  it("converts a mixed RGB value", () => {
    expect(rgbToHsv({ r: 52, g: 152, b: 219 })).toEqual({
      h: 204.07,
      s: 76.26,
      v: 85.88
    });
  });

  it("converts black", () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, v: 0 });
  });
});

describe("HEX to HSL and HSV", () => {
  it("converts HEX to HSL through RGB", () => {
    expect(hexToHsl("#3498db")).toEqual({ h: 204.07, s: 69.87, l: 53.14 });
  });

  it("converts HEX to HSV through RGB", () => {
    expect(hexToHsv("#3498db")).toEqual({ h: 204.07, s: 76.26, v: 85.88 });
  });
});
