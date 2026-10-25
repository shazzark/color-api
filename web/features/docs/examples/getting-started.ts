import { convertColor, generateColors, type ColorValue } from "chromaforge";

const conversion = convertColor({ format: "hex", value: "#3498db" }, "oklch");
const color: ColorValue = conversion.output;
const generated = generateColors(5, { seed: "brand-system" });

console.log(color, conversion.gamutMapped);
console.log(generated.algorithm, generated.colors);
