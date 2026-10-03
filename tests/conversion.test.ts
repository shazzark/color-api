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
  linearSrgbToOklab,
  oklabToLinearSrgb,
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
import { detectColorFormat, normalizeColor, validateColor } from "../src/color/validation.js";

// OKLab primary reference coordinates: Björn Ottosson's published derivation
// (https://bottosson.github.io/posts/oklab/), cross-checked against CSS Color 4
// conversion equations (https://www.w3.org/TR/css-color-4/).

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
    expect(validateHexColor("#12345678")).toBe("#12345678");
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
    expect(hslToHsv(hsl)).toEqual({ h: 204.07, s: 76.25, v: 85.88 });
    expect(hsvToHsl(hsv)).toEqual({ h: 204.07, s: 69.87, l: 53.13 });
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
      convertColor({ format: "hex", value: "#3498db" }, "rgb"),
    ).toEqual({
      input: { format: "hex", value: "#3498db" },
      output: { format: "rgb", value: { r: 52, g: 152, b: 219 } },
      gamutMapped: false,
    });
  });

  it("rejects an invalid color envelope", () => {
    expect(() =>
      convertColor({ format: "hsl", value: { h: 0, s: 101, l: 50 } }, "rgb"),
    ).toThrow(InvalidColorError);
  });
});

describe("alpha, canonical forms, and perceptual conversions", () => {
  it("normalizes HEX to lowercase with a hash and preserves HEX8 alpha", () => {
    expect(normalizeColor({ format: "hex", value: "FF000080" })).toEqual({ format: "hex", value: "#ff000080" });
    expect(normalizeColor({ format: "hex", value: "#ff0000ff" })).toEqual({ format: "hex", value: "#ff0000" });
    expect(convertColor({ format: "hex", value: "#00000080" }, "rgb").output).toEqual({
      format: "rgb", value: { r: 0, g: 0, b: 0, alpha: 0.502 }
    });
    expect(convertColor({ format: "rgb", value: { r: 0, g: 0, b: 0, alpha: 0 } }, "hex").output).toEqual({ format: "hex", value: "#00000000" });
    expect(convertColor({ format: "rgb", value: { r: 0, g: 0, b: 0, alpha: 0.5 } }, "hex").output).toEqual({ format: "hex", value: "#00000080" });
  });

  it("normalizes structured alpha and hue without mutating input", () => {
    const source = { format: "hsl", value: { h: -120, s: 50, l: 25, alpha: 0.123456 } };
    expect(normalizeColor(source)).toEqual({ format: "hsl", value: { h: 240, s: 50, l: 25, alpha: 0.1235 } });
    expect(source.value.h).toBe(-120);
    expect(validateColor({ format: "oklch", value: { l: 0.5, c: -1, h: 3 } }).valid).toBe(false);
    expect(normalizeColor({ format: "oklch", value: { l: 0.5, c: 0, h: 219 } })).toEqual({ format: "oklch", value: { l: 0.5, c: 0, h: 0 } });
    expect(normalizeColor({ format: "hsl", value: { h: 78, s: 0, l: 50 } })).toEqual({ format: "hsl", value: { h: 0, s: 0, l: 50 } });
    expect(normalizeColor({ format: "hsl", value: { h: 359.999, s: 50, l: 50 } })).toEqual({ format: "hsl", value: { h: 0, s: 50, l: 50 } });
    expect(validateColor({ format: "rgb", value: { r: 256, g: 0, b: 0 } })).toEqual({
      valid: false,
      errors: [{ code: "INVALID_COLOR", path: "/value", message: "Invalid RGB color value" }]
    });
    expect(validateColor({ format: "rgb", value: { r: 0, g: 0, b: 0, alpha: Number.NaN } }).valid).toBe(false);
    expect(validateColor({ format: "rgb", value: { r: 0, g: 0, b: 0, ignored: true } }).valid).toBe(false);
    expect(validateColor(null).valid).toBe(false);
    expect(() => convertColor({ format: "oklab", value: { l: 0.5, a: 1e308, b: 1e308 } }, "rgb")).toThrow(InvalidColorError);
  });

  it("preserves alpha endpoints and continuous alpha through structured targets", () => {
    expect(convertColor({ format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 0 } }, "oklab").output)
      .toEqual({ format: "oklab", value: { l: 0.628, a: 0.2249, b: 0.1258, alpha: 0 } });
    expect(convertColor({ format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 1 } }, "oklab").output)
      .toEqual({ format: "oklab", value: { l: 0.628, a: 0.2249, b: 0.1258 } });
    expect(hslToRgb({ h: 0, s: 100, l: 50, alpha: 0.49996 }).alpha).toBe(0.5);
    expect(convertColor({ format: "oklab", value: { l: 0.628, a: 0.2249, b: 0.1258, alpha: 0.49996 } }, "rgb").output)
      .toEqual({ format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 0.5 } });
  });

  it("supports every directed format pair", () => {
    const inputs = [
      { format: "hex" as const, value: "#ff0000" },
      { format: "rgb" as const, value: { r: 255, g: 0, b: 0 } },
      { format: "hsl" as const, value: { h: 0, s: 100, l: 50 } },
      { format: "hsv" as const, value: { h: 0, s: 100, v: 100 } },
      { format: "oklab" as const, value: { l: 0.6279553606, a: 0.2248630611, b: 0.1258462985 } },
      { format: "oklch" as const, value: { l: 0.6279553606, c: 0.2576833077, h: 29.233885 } }
    ];
    for (const input of inputs) {
      for (const outputFormat of ["hex", "rgb", "hsl", "hsv", "oklab", "oklch"] as const) {
        expect(convertColor(input, outputFormat).output.format).toBe(outputFormat);
      }
    }
  });

  it("detects only tagged formats and hash-prefixed HEX strings", () => {
    expect(detectColorFormat({ format: "oklab", value: null })).toBe("oklab");
    expect(detectColorFormat("#12345678")).toBe("hex");
    expect(detectColorFormat("123456")).toBeUndefined();
    expect(detectColorFormat({ r: 1, g: 2, b: 3 })).toBeUndefined();
  });

  it("matches published OKLab reference vectors for sRGB primaries", () => {
    const unroundedRed = linearSrgbToOklab([1, 0, 0]);
    expect(unroundedRed.l).toBeCloseTo(0.6279553606, 6);
    expect(unroundedRed.a).toBeCloseTo(0.2248630611, 6);
    expect(unroundedRed.b).toBeCloseTo(0.1258462985, 6);
    expect(oklabToLinearSrgb(unroundedRed)[0]).toBeCloseTo(1, 6);
    expect(oklabToLinearSrgb(unroundedRed)[1]).toBeCloseTo(0, 6);
    expect(oklabToLinearSrgb(unroundedRed)[2]).toBeCloseTo(0, 6);
    const cases = [
      { hex: "#ff0000", lab: [0.6279553606, 0.2248630611, 0.1258462985], lch: [0.6279553606, 0.2576833077, 29.233885] },
      { hex: "#00ff00", lab: [0.8664396115, -0.2338875742, 0.1794984799], lch: [0.8664396115, 0.2948, 142.495339] },
      { hex: "#0000ff", lab: [0.4520137184, -0.0324569842, -0.3115281477], lch: [0.4520137184, 0.3132143717, 264.052021] }
    ];
    for (const item of cases) {
      const lab = convertColor({ format: "hex", value: item.hex }, "oklab").output;
      const lch = convertColor({ format: "hex", value: item.hex }, "oklch").output;
      if (lab.format !== "oklab" || lch.format !== "oklch") throw new Error("Unexpected conversion format");
      expect([lab.value.l, lab.value.a, lab.value.b]).toEqual(item.lab.map((v) => Math.round(v * 10000) / 10000));
      expect([lch.value.l, lch.value.c, lch.value.h]).toEqual(item.lch.map((v, i) => Math.round(v * (i === 2 ? 10000 : 10000)) / 10000));
    }
  });

  it("reports explicit CSS local-MINDE gamut mapping for out-of-gamut OKLCH", () => {
    const result = convertColor({ format: "oklch", value: { l: 0.6, c: 0.4, h: 30 } }, "rgb");
    expect(result.gamutMapped).toBe(true);
    if (result.gamutMapped) expect(result.gamutMapping).toBe("css-color-4-local-minde");
    expect(result.output).toMatchObject({ format: "rgb", value: { r: expect.any(Number), g: expect.any(Number), b: expect.any(Number) } });
    if (result.output.format === "rgb") {
      expect([result.output.value.r, result.output.value.g, result.output.value.b].every((channel) => channel >= 0 && channel <= 255)).toBe(true);
    }
    expect(convertColor({ format: "oklch", value: { l: 0, c: 0.4, h: 30 } }, "hex").output).toEqual({ format: "hex", value: "#000000" });
    expect(convertColor({ format: "oklch", value: { l: 1, c: 0.4, h: 30 } }, "hex").output).toEqual({ format: "hex", value: "#ffffff" });
    const nearBoundary = convertColor({ format: "oklch", value: { l: 0.628, c: 0.26, h: 29.2339 } }, "hex");
    expect(nearBoundary.gamutMapped).toBe(true);
    expect(nearBoundary.output).toEqual({ format: "hex", value: "#ff0000" });
    // W3C CSS Color 4 §14.2.1 local-MINDE reference: the independently
    // evaluated OKLCH vector (0.87, 0.30, 142.5°) maps to the sRGB green edge.
    expect(convertColor({ format: "oklch", value: { l: 0.87, c: 0.3, h: 142.5 } }, "hex"))
      .toMatchObject({ output: { format: "hex", value: "#00ff00" }, gamutMapped: true, gamutMapping: "css-color-4-local-minde" });
  });

  it("normalizes neutral OKLCH hue and retains raw alpha until byte serialization", () => {
    for (const value of [
      { format: "rgb" as const, value: { r: 0, g: 0, b: 0 } },
      { format: "rgb" as const, value: { r: 128, g: 128, b: 128 } },
      { format: "rgb" as const, value: { r: 255, g: 255, b: 255 } }
    ]) {
      const result = convertColor(value, "oklch").output;
      if (result.format !== "oklch") throw new Error("Unexpected conversion format");
      expect(result.value.c).toBe(0);
      expect(result.value.h).toBe(0);
    }
    expect(convertColor({ format: "rgb", value: { r: 255, g: 0, b: 0, alpha: 0.49996 } }, "hex").output)
      .toEqual({ format: "hex", value: "#ff00007f" });
  });
});
