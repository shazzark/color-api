import {
  adjustLightness,
  compositeColors,
  generateHslPalette,
  generateOklchScale,
  generateShades,
  mixColors,
  type ColorValue
} from "chromaforge";

const base: ColorValue = { format: "hex", value: "#3498db" };

const shades = generateShades(base, 5, "hex");
const palette = generateHslPalette({ h: 204, s: 70, l: 53 }, "analogous", { count: 5 });
const scale = generateOklchScale([
  { position: 0, color: { format: "oklch", value: { l: 0.4, c: 0.1, h: 250 } } },
  { position: 1, color: { format: "oklch", value: { l: 0.8, c: 0.1, h: 250 } } }
], 5);

const lighter = adjustLightness(base, 0.08);
const mixed = mixColors(base, { format: "hex", value: "#e74c3c" }, 0.5, "oklab");
const composite = compositeColors(
  { format: "hex", value: "#ff000080" },
  { format: "hex", value: "#ffffff" }
);

console.log(shades, palette, scale, lighter, mixed, composite);
