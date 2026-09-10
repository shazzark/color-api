export type HexColor = string;

export type ColorFormat = "hex" | "rgb" | "hsl" | "hsv";

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
