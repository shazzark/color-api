import { describe, expect, it } from "vitest";
import {
  convertColor,
  hexToHsl,
  hexToHsv,
  hexToRgb,
  hexToRgb as parseHex,
  hslToHex,
  hslToHsv,
  hslToRgb,
  hsvToHex,
  hsvToHsl,
  hsvToRgb,
  InvalidColorError,
  rgbToHex,
  rgbToHsl,
  rgbToHsv
} from "../src/color/conversion.js";
import {
  validateHexColor,
  validateHslColor,
  validateHsvColor,
  validateRgbColor
} from "../src/color/validation.js";

describe("HEX and RGB conversions", () => {
  it("converts a six-digit HEX value", () => {
    expect(hexToRgb("#3498db")).toEqual({ r: 52, g: 152, b: 219 });
  });

  it("accepts uppercase HEX without a hash", () => {
    expect(hexToRgb("FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("converts RGB to canonical lowercase HEX", () => {
    expect(rgbToHex({ r: 52, g: 152, b: 219 })).toBe("#3498db");
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff");
  });

  it("round trips HEX through RGB", () => {
    expect(rgbToHex(parseHex("#3498db"))).toBe("#3498db");
  });

  it("rejects invalid HEX values", () => {
    expect(() => validateHexColor("#12fg45")).toThrow(InvalidColorError);
    expect(() => validateHexColor("#123")).toThrow(InvalidColorError);
    expect(() => validateHexColor("#12345678")).toThrow(InvalidColorError);
  });
});

describe("RGB to HSL and HSV", () => {
  it("converts a mixed RGB value to HSL", () => {
    expect(rgbToHsl({ r: 52, g: 152, b: 219 })).toEqual({
      h: 204.07,
      s: 69.87,
      l: 53.14
    });
  });

  it("converts a mixed RGB value to HSV", () => {
    expect(rgbToHsv({ r: 52, g: 152, b: 219 })).toEqual({
      h: 204.07,
      s: 76.26,
      v: 85.88
    });
  });

  it("uses zero hue and saturation for achromatic colors", () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({
      h: 0,
      s: 0,
      l: 50.2
    });
    expect(rgbToHsv({ r: 128, g: 128, b: 128 })).toEqual({
      h: 0,
      s: 0,
      v: 50.2
    });
  });

  it("handles black and white boundaries", () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
    expect(rgbToHsv({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, v: 100 });
  });
});

describe("HSL and HSV conversions", () => {
  it("converts HSL to RGB and HSV to RGB", () => {
    const hsl = { h: 204.07, s: 69.87, l: 53.14 };
    const hsv = { h: 204.07, s: 76.26, v: 85.88 };

    expect(hslToRgb(hsl)).toEqual({ r: 52, g: 152, b: 219 });
    expect(hsvToRgb(hsv)).toEqual({ r: 52, g: 152, b: 219 });
  });

  it("composes HSL and HSV conversions through RGB", () => {
    const hsl = { h: 204.07, s: 69.87, l: 53.14 };
    const hsv = { h: 204.07, s: 76.26, v: 85.88 };

    expect(hslToHex(hsl)).toBe("#3498db");
    expect(hsvToHex(hsv)).toBe("#3498db");
    expect(hslToHsv(hsl)).toEqual(hsv);
    expect(hsvToHsl(hsv)).toEqual(hsl);
  });

  it("round trips RGB through HSL and HSV", () => {
    const rgb = { r: 52, g: 152, b: 219 };

    expect(hslToRgb(rgbToHsl(rgb))).toEqual(rgb);
    expect(hsvToRgb(rgbToHsv(rgb))).toEqual(rgb);
  });

  it("normalizes hue wrapping", () => {
    expect(hslToRgb({ h: -120, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
    expect(hsvToRgb({ h: 480, s: 100, v: 100 })).toEqual({ r: 0, g: 255, b: 0 });
  });

  it("converts primary colors at their boundaries", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hsvToRgb({ h: 240, s: 100, v: 100 })).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("converts HEX to HSL and HSV through RGB", () => {
    expect(hexToHsl("#3498db")).toEqual({ h: 204.07, s: 69.87, l: 53.14 });
    expect(hexToHsv("#3498db")).toEqual({ h: 204.07, s: 76.26, v: 85.88 });
  });
});

describe("color validation", () => {
  it("validates RGB channels", () => {
    expect(validateRgbColor({ r: 0, g: 128, b: 255 })).toEqual({ r: 0, g: 128, b: 255 });
    expect(() => validateRgbColor({ r: 1.5, g: 0, b: 0 })).toThrow(InvalidColorError);
    expect(() => validateRgbColor({ r: 256, g: 0, b: 0 })).toThrow(InvalidColorError);
    expect(() => validateRgbColor({ r: 0, g: 0 })).toThrow(InvalidColorError);
  });

  it("validates and normalizes HSL values", () => {
    expect(validateHslColor({ h: -120, s: 50, l: 25 })).toEqual({ h: 240, s: 50, l: 25 });
    expect(validateHslColor({ h: 360, s: 0, l: 100 })).toEqual({ h: 0, s: 0, l: 100 });
    expect(() => validateHslColor({ h: 0, s: 101, l: 50 })).toThrow(InvalidColorError);
    expect(() => validateHslColor({ h: Number.NaN, s: 0, l: 0 })).toThrow(InvalidColorError);
  });

  it("validates and normalizes HSV values", () => {
    expect(validateHsvColor({ h: 480, s: 50, v: 25 })).toEqual({ h: 120, s: 50, v: 25 });
    expect(() => validateHsvColor({ h: 0, s: 0, v: 101 })).toThrow(InvalidColorError);
    expect(() => validateHsvColor({ h: Number.POSITIVE_INFINITY, s: 0, v: 0 })).toThrow(InvalidColorError);
  });
});

describe("convertColor", () => {
  it("normalizes and converts a validated source value", () => {
    expect(
      convertColor("hex", "rgb", {
        format: "hex",
        value: "#3498db",
      }),
    ).toEqual({
      format: "rgb",
      value: { r: 52, g: 152, b: 219 },
    });
  });

  it("rejects a source format mismatch", () => {
    expect(() =>
      convertColor("hex", "rgb", {
        format: "hsl",
        value: { h: 0, s: 100, l: 50 },
      }),
    ).toThrow(InvalidColorError);
  });
});
