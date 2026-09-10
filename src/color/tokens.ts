import { convertColor } from "./conversion.js";
import type { ColorToken, ColorTokenResponse, ColorValue } from "./types.js";

export function createCssVariableName(name: string): string {
  return `--color-${name}`;
}

export function formatCssColor(color: ColorValue): string {
  switch (color.format) {
    case "hex":
      return color.value;
    case "rgb":
      return `rgb(${color.value.r}, ${color.value.g}, ${color.value.b})`;
    case "hsl":
      return `hsl(${color.value.h}, ${color.value.s}%, ${color.value.l}%)`;
    case "hsv": {
      const rgb = convertColor("hsv", "rgb", color);

      if (rgb.format !== "rgb") {
        throw new Error("Unable to serialize HSV color as CSS");
      }

      return formatCssColor(rgb);
    }
  }
}

export function createToken(name: string, color: ColorValue): ColorToken {
  const cssVariable = createCssVariableName(name);

  return {
    name,
    color,
    cssVariable,
    cssValue: formatCssColor(color)
  };
}

export function createCssBlock(token: ColorToken): string {
  return `:root {\n  ${token.cssVariable}: ${token.cssValue};\n}`;
}

export function createTokenResponse(
  name: string,
  color: ColorValue
): ColorTokenResponse {
  const token = createToken(name, color);

  return {
    token,
    css: createCssBlock(token)
  };
}