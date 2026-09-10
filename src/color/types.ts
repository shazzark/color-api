export type HexColor = string;

export type ColorFormat = "hex" | "rgb" | "hsl" | "hsv";

export type PaletteStrategy =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "monochromatic";

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

export type ColorValue =
  | { format: "hex"; value: HexColor }
  | { format: "rgb"; value: RgbColor }
  | { format: "hsl"; value: HslColor }
  | { format: "hsv"; value: HsvColor };

export interface WcagTextResult {
  aa: boolean;
  aaa: boolean;
}

export interface WcagResults {
  normalText: WcagTextResult;
  largeText: WcagTextResult;
}

export interface ContrastResult {
  contrastRatio: number;
  wcag: WcagResults;
}
