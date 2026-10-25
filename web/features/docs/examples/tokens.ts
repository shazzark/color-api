import {
  createCssVariablesBlock,
  serializeDesignTokens,
  type ColorValue
} from "chromaforge";

const colors: Record<string, ColorValue> = {
  brand: { format: "hex", value: "#3498db" },
  "surface-muted": { format: "oklch", value: { l: 0.92, c: 0.02, h: 250 } }
};

const css = createCssVariablesBlock(colors);
const versionedJson = serializeDesignTokens(colors);

console.log(css, versionedJson);
