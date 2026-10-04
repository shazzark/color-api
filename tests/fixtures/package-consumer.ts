import {
  adjustAlpha, analyzeContrast, convertColor, createCssVariablesBlock,
  generateColors, generateHslPalette, generateOklchScale, normalizeColor
} from "chromaforge";
import type { ColorValue, ContrastOptions, OklchStop } from "chromaforge";

const brand: ColorValue = normalizeColor({ format: "hex", value: "#3498db" });
const foreground = adjustAlpha(brand, 0.8);
const converted = convertColor(foreground, "oklch");
const palette = generateHslPalette({ h: 204, s: 69, l: 53 }, "tetradic");
const generated = generateColors(3, { seed: "consumer" });
const stops: OklchStop[] = [
  { position: 0, color: { format: "oklch", value: { l: 0.2, c: 0.05, h: 240 } } },
  { position: 1, color: { format: "oklch", value: { l: 0.8, c: 0.05, h: 240 } } }
];
const scale = generateOklchScale(stops, 5);
const css = createCssVariablesBlock({ brand });
const contrastOptions: ContrastOptions = { criterion: "wcag-2.2-1.4.3", textSize: "normal" };
void [converted, palette, generated, scale, css, contrastOptions];
