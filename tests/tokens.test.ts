import { describe, expect, it } from "vitest";
import {
  createColorObject, createCssBlock, createCssVariableName, createCssVariablesBlock, createScaleTokenMap,
  createDesignTokenDocument, createTailwindColorData, createToken, formatCssColor, serializeDesignTokens,
  serializeJavaScriptObject, serializeScssVariables, serializeTypeScriptObject
} from "../src/color/tokens.js";
import type { ColorValue } from "../src/color/types.js";
import { generateOklchScale } from "../src/color/operations.js";
import { InvalidRequestError, validateTokenName } from "../src/color/validation.js";

describe("token serialization", () => {
  it("creates a deterministic HEX token and CSS block", () => {
    const token = createToken("brand", {
      format: "hex",
      value: "#3498db"
    });

    expect(token).toEqual({
      name: "brand",
      color: { format: "hex", value: "#3498db" },
      cssVariable: "--color-brand",
      cssValue: "#3498db"
    });
    expect(createCssBlock(token)).toBe(":root {\n  --color-brand: #3498db;\n}");
  });

  it("serializes RGB and HSL values for CSS", () => {
    expect(createToken("brand-primary", {
      format: "rgb",
      value: { r: 52, g: 152, b: 219 }
    }).cssValue).toBe("rgb(52, 152, 219)");
    expect(createToken("brand-500", {
      format: "hsl",
      value: { h: 204.07, s: 69.87, l: 53.14 }
    }).cssValue).toBe("hsl(204.07, 69.87%, 53.14%)");
  });

  it("keeps HSV structured output but serializes HSV as RGB CSS", () => {
    const color: ColorValue = {
      format: "hsv",
      value: { h: 204.07, s: 76.26, v: 85.88 }
    };

    expect(createToken("brand", color)).toEqual({
      name: "brand",
      color,
      cssVariable: "--color-brand",
      cssValue: "rgb(52, 152, 219)"
    });
  });

  it("creates CSS variable names deterministically", () => {
    expect(createCssVariableName("surface-muted")).toBe("--color-surface-muted");
  });

  it("validates the legacy single-token CSS entry points", () => {
    const color: ColorValue = { format: "hex", value: "#ffffff" };
    expect(() => createCssVariableName("x; color:red")).toThrow(InvalidRequestError);
    expect(() => createToken("x; color:red", color)).toThrow(InvalidRequestError);
    expect(() => createCssBlock({
      name: "safe-name", color, cssVariable: "--safe; color:red", cssValue: "red; } body { display:none"
    })).not.toThrow();
    expect(createCssBlock({
      name: "safe-name", color, cssVariable: "--safe; color:red", cssValue: "red; } body { display:none"
    })).toBe(":root {\n  --color-safe-name: #ffffff;\n}");
    expect(() => Reflect.apply(formatCssColor, undefined, [{ format: "rgb", value: { r: "red", g: 0, b: 0 } }]))
      .toThrow();
  });
});

describe("token name validation", () => {
  it.each(["brand", "brand-primary", "brand-500", "surface-muted"])(
    "accepts %s",
    (name) => {
      expect(validateTokenName(name)).toBe(name);
    }
  );

  it.each(["", "Brand", "123-brand", "brand_primary", "brand primary", "brand; color: red"])(
    "rejects %s",
    (name) => {
      expect(() => validateTokenName(name)).toThrow(InvalidRequestError);
    }
  );
});

describe("multi-color design token outputs", () => {
  const colors = {
    brand: { format: "hex", value: "#123456" } as const,
    "surface-muted": { format: "rgb", value: { r: 10, g: 20, b: 30, alpha: 0.5 } } as const
  };

  it("returns ordered validated typed color objects and stable versioned JSON", () => {
    const typedColors: Record<string, ColorValue> = createColorObject(colors);
    expect(Object.keys(typedColors)).toEqual(["brand", "surface-muted"]);
    expect(createDesignTokenDocument(colors)).toEqual({
      schemaVersion: 1,
      colors: {
        brand: { $type: "color", $value: colors.brand, cssValue: "#123456" },
        "surface-muted": { $type: "color", $value: colors["surface-muted"], cssValue: "rgb(10 20 30 / 0.5)" }
      }
    });
    expect(serializeDesignTokens(colors)).toBe(`${JSON.stringify(createDesignTokenDocument(colors), null, 2)}`);
  });

  it("serializes ordered CSS, JavaScript, TypeScript, Tailwind, and SCSS data", () => {
    expect(createCssVariablesBlock(colors)).toBe(":root {\n  --color-brand: #123456;\n  --color-surface-muted: rgb(10 20 30 / 0.5);\n}");
    expect(createTailwindColorData(colors)).toEqual({ theme: { extend: { colors: { brand: "#123456", "surface-muted": "rgb(10 20 30 / 0.5)" } } } });
    expect(serializeJavaScriptObject(colors)).toContain('"surface-muted"');
    expect(serializeTypeScriptObject(colors)).toContain('satisfies Record<string, ColorValue>');
    expect(serializeScssVariables(colors)).toBe("$color-brand: #123456;\n$color-surface-muted: rgb(10 20 30 / 0.5);");
  });

  it.each(["Brand", "bad; color:red", "__proto__", "123-token"])("rejects unsafe token key %s across serializers", (name) => {
    expect(() => createCssVariablesBlock({ [name]: colors.brand })).toThrow(InvalidRequestError);
    expect(() => createDesignTokenDocument({ [name]: colors.brand })).toThrow(InvalidRequestError);
  });

  it("does not mutate or retain the input object", () => {
    const output = createColorObject(colors);
    expect(output).not.toBe(colors);
    expect(colors.brand).toEqual({ format: "hex", value: "#123456" });
  });

  it("serializes generated scales under ordered one-based token keys", () => {
    const scale = generateOklchScale([
      { position: 0, color: { format: "oklch", value: { l: 0.2, c: 0.05, h: 240 } } },
      { position: 1, color: { format: "oklch", value: { l: 0.8, c: 0.05, h: 240 } } }
    ], 3);
    const tokens = createScaleTokenMap(scale, "brand-scale");
    expect(Object.keys(tokens)).toEqual(["brand-scale-1", "brand-scale-2", "brand-scale-3"]);
    expect(createCssVariablesBlock(tokens)).toContain("--color-brand-scale-1:");
  });
});
