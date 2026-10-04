import { convertColor } from "./conversion.js";
import { normalizeColor, validateTokenName } from "./validation.js";
import type { ColorConversionResult, ColorToken, ColorTokenResponse, ColorValue } from "./types.js";

export type ColorTokenMap = Readonly<Record<string, ColorValue>>;
export interface SerializedColorToken { $type: "color"; $value: ColorValue; cssValue: string }
export interface DesignTokenDocument {
  schemaVersion: 1;
  colors: Record<string, SerializedColorToken>;
}

function normalizeTokenMap(tokens: ColorTokenMap): Record<string, ColorValue> {
  if (typeof tokens !== "object" || tokens === null || Array.isArray(tokens)) {
    throw new TypeError("Color tokens must be an object keyed by token name");
  }
  const normalized: Record<string, ColorValue> = {};
  for (const [name, color] of Object.entries(tokens)) {
    validateTokenName(name);
    normalized[name] = normalizeColor(color);
  }
  return normalized;
}

export function createCssVariableName(name: string): string {
  validateTokenName(name);
  return `--color-${name}`;
}

export function formatCssColor(color: ColorValue): string {
  const normalized = normalizeColor(color);
  switch (normalized.format) {
    case "hex":
      return normalized.value;
    case "rgb":
      return normalized.value.alpha === undefined
        ? `rgb(${normalized.value.r}, ${normalized.value.g}, ${normalized.value.b})`
        : `rgb(${normalized.value.r} ${normalized.value.g} ${normalized.value.b} / ${normalized.value.alpha})`;
    case "hsl":
      return normalized.value.alpha === undefined
        ? `hsl(${normalized.value.h}, ${normalized.value.s}%, ${normalized.value.l}%)`
        : `hsl(${normalized.value.h} ${normalized.value.s}% ${normalized.value.l}% / ${normalized.value.alpha})`;
    case "hsv": {
      const rgb = convertColor(normalized, "rgb").output;

      if (rgb.format !== "rgb") {
        throw new Error("Unable to serialize HSV color as CSS");
      }

      return formatCssColor(rgb);
    }
    case "oklab": {
      const { l, a, b, alpha } = normalized.value;
      return `oklab(${l} ${a} ${b}${alpha === undefined ? "" : ` / ${alpha}`})`;
    }
    case "oklch": {
      const { l, c, h, alpha } = normalized.value;
      return `oklch(${l} ${c} ${h}${alpha === undefined ? "" : ` / ${alpha}`})`;
    }
  }
}

export function createToken(name: string, color: ColorValue): ColorToken {
  const validName = validateTokenName(name);
  const normalizedColor = normalizeColor(color);
  const cssVariable = createCssVariableName(validName);

  return {
    name: validName,
    color: normalizedColor,
    cssVariable,
    cssValue: formatCssColor(normalizedColor)
  };
}

export function createCssBlock(token: ColorToken): string {
  const validated = createToken(token.name, token.color);
  return `:root {\n  ${validated.cssVariable}: ${validated.cssValue};\n}`;
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

/** Returns a fresh, validated color object while preserving insertion order. */
export function createColorObject(tokens: ColorTokenMap): Record<string, ColorValue> {
  return normalizeTokenMap(tokens);
}

/** Converts ordered scale conversion results into safe one-based token names. */
export function createScaleTokenMap(
  scale: readonly ColorConversionResult[], prefix = "scale"
): Record<string, ColorValue> {
  validateTokenName(prefix);
  if (!Array.isArray(scale) || scale.length < 1) throw new TypeError("Scale must contain at least one color result");
  const tokens: Record<string, ColorValue> = {};
  scale.forEach((result, index) => {
    if (typeof result !== "object" || result === null || !("output" in result)) {
      throw new TypeError("Scale entries must be color conversion results");
    }
    tokens[`${prefix}-${index + 1}`] = result.output;
  });
  return normalizeTokenMap(tokens);
}

/** Stable, versioned project schema for JSON design-token output. */
export function createDesignTokenDocument(tokens: ColorTokenMap): DesignTokenDocument {
  const colors: Record<string, SerializedColorToken> = {};
  for (const [name, color] of Object.entries(normalizeTokenMap(tokens))) {
    colors[name] = { $type: "color", $value: color, cssValue: formatCssColor(color) };
  }
  return { schemaVersion: 1, colors };
}

export function serializeDesignTokens(tokens: ColorTokenMap): string {
  return JSON.stringify(createDesignTokenDocument(tokens), null, 2);
}

/** Ordered CSS variables for a set of tokens; names are validated before interpolation. */
export function createCssVariablesBlock(tokens: ColorTokenMap): string {
  const declarations = Object.entries(normalizeTokenMap(tokens))
    .map(([name, color]) => `  ${createCssVariableName(name)}: ${formatCssColor(color)};`);
  return `:root {\n${declarations.join("\n")}\n}`;
}

/** Plain Tailwind theme data; no Tailwind package or version is imported. */
export function createTailwindColorData(tokens: ColorTokenMap): { theme: { extend: { colors: Record<string, string> } } } {
  const colors: Record<string, string> = {};
  for (const [name, color] of Object.entries(normalizeTokenMap(tokens))) colors[name] = formatCssColor(color);
  return { theme: { extend: { colors } } };
}

export function serializeJavaScriptObject(tokens: ColorTokenMap): string {
  return `export const colors = ${JSON.stringify(createColorObject(tokens), null, 2)};\n`;
}

export function serializeTypeScriptObject(tokens: ColorTokenMap): string {
  return `import type { ColorValue } from "color-api";\n\nexport const colors = ${JSON.stringify(createColorObject(tokens), null, 2)} satisfies Record<string, ColorValue>;\n`;
}

export function serializeScssVariables(tokens: ColorTokenMap): string {
  return Object.entries(normalizeTokenMap(tokens))
    .map(([name, color]) => `$color-${name}: ${formatCssColor(color)};`)
    .join("\n");
}
