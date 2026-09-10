import { describe, expect, it } from "vitest";
import { createCssBlock, createCssVariableName, createToken } from "../src/color/tokens.js";
import type { ColorValue } from "../src/color/types.js";
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
