import {
  convertColor,
  isColorFormat,
  validateColorValue,
  type ColorFormat,
  type ColorValue
} from "chromaforge";

export const COLOR_FORMATS: readonly ColorFormat[] = ["hex", "rgb", "hsl", "hsv", "oklab", "oklch"];

export const COLOR_FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  hsv: "HSV",
  oklab: "OKLab",
  oklch: "OKLCH"
};

export interface ColorField {
  key: string;
  label: string;
  min?: number;
  max?: number;
  step: string;
  optional?: boolean;
}

const alphaField: ColorField = { key: "alpha", label: "Alpha (optional)", min: 0, max: 1, step: "0.01", optional: true };

export const COLOR_FIELDS: Partial<Record<ColorFormat, readonly ColorField[]>> = {
  rgb: [
    { key: "r", label: "Red", min: 0, max: 255, step: "1" },
    { key: "g", label: "Green", min: 0, max: 255, step: "1" },
    { key: "b", label: "Blue", min: 0, max: 255, step: "1" },
    alphaField
  ],
  hsl: [
    { key: "h", label: "Hue (degrees)", step: "any" },
    { key: "s", label: "Saturation (%)", min: 0, max: 100, step: "0.1" },
    { key: "l", label: "Lightness (%)", min: 0, max: 100, step: "0.1" },
    alphaField
  ],
  hsv: [
    { key: "h", label: "Hue (degrees)", step: "any" },
    { key: "s", label: "Saturation (%)", min: 0, max: 100, step: "0.1" },
    { key: "v", label: "Value (%)", min: 0, max: 100, step: "0.1" },
    alphaField
  ],
  oklab: [
    { key: "l", label: "Lightness (0–1)", min: 0, max: 1, step: "0.001" },
    { key: "a", label: "A", step: "0.001" },
    { key: "b", label: "B", step: "0.001" },
    alphaField
  ],
  oklch: [
    { key: "l", label: "Lightness (0–1)", min: 0, max: 1, step: "0.001" },
    { key: "c", label: "Chroma", min: 0, step: "0.001" },
    { key: "h", label: "Hue (degrees)", step: "any" },
    alphaField
  ]
};

export type ColorDraft = Record<string, string>;

export function draftFromColor(color: ColorValue): ColorDraft {
  if (color.format === "hex") return { value: color.value };
  return Object.fromEntries(Object.entries(color.value).map(([key, value]) => [key, String(value)]));
}

export function parseColorDraft(format: ColorFormat, draft: ColorDraft): ColorValue {
  if (format === "hex") return validateColorValue(format, draft.value ?? "");

  const fields = COLOR_FIELDS[format];
  if (!fields) throw new Error(`No editable fields are configured for ${COLOR_FORMAT_LABELS[format]}.`);

  const value: Record<string, number> = {};
  for (const field of fields) {
    const raw = draft[field.key] ?? "";
    if (field.optional && raw.trim() === "") continue;
    value[field.key] = raw.trim() === "" ? Number.NaN : Number(raw);
  }
  return validateColorValue(format, value);
}

export function formattedColorValue(color: ColorValue): string {
  if (color.format === "hex") return color.value;
  return JSON.stringify(color.value);
}

export function colorPreviewHex(color: ColorValue): { hex: string; gamutMapped: boolean; gamutMapping?: string } {
  const result = convertColor(color, "hex");
  if (result.output.format !== "hex") throw new Error("The package did not return a HEX preview.");
  return {
    hex: result.output.value,
    gamutMapped: result.gamutMapped,
    ...(result.gamutMapped ? { gamutMapping: result.gamutMapping } : {})
  };
}

export function colorFormatFromSelection(value: string): ColorFormat | undefined {
  return isColorFormat(value) ? value : undefined;
}
