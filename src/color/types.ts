export type HexColor = string;

export type ColorFormat = "hex" | "rgb" | "hsl" | "hsv" | "oklab" | "oklch";

export type PaletteStrategy =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "monochromatic";

export interface RgbColor { r: number; g: number; b: number; alpha?: number }
export interface HslColor { h: number; s: number; l: number; alpha?: number }
export interface HsvColor { h: number; s: number; v: number; alpha?: number }
export interface OklabColor { l: number; a: number; b: number; alpha?: number }
export interface OklchColor { l: number; c: number; h: number; alpha?: number }

export type ColorValue =
  | { format: "hex"; value: HexColor }
  | { format: "rgb"; value: RgbColor }
  | { format: "hsl"; value: HslColor }
  | { format: "hsv"; value: HsvColor }
  | { format: "oklab"; value: OklabColor }
  | { format: "oklch"; value: OklchColor };

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
  index?: number;
}

export type ColorValidationResult =
  | { valid: true; color: ColorValue }
  | { valid: false; errors: ValidationIssue[] };

export interface WcagTextResult { aa: boolean; aaa: boolean }
export interface WcagResults { normalText: WcagTextResult; largeText: WcagTextResult }
export interface ContrastResult { contrastRatio: number; wcag: WcagResults }
export interface ColorToken { name: string; color: ColorValue; cssVariable: string; cssValue: string }
export interface ColorTokenResponse { token: ColorToken; css: string }

export type ColorConversionResult = {
  input: ColorValue;
  output: ColorValue;
} & (
  | { gamutMapped: false }
  | { gamutMapped: true; gamutMapping: "css-color-4-local-minde" }
);

export interface BatchConversionResponse { results: ColorConversionResult[] }
