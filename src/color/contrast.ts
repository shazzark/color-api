import type { ContrastResult, RgbColor, WcagResults } from "./types.js";

function linearizeChannel(channel: number): number {
  const normalized = channel / 255;

  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function relativeLuminance({ r, g, b }: RgbColor): number {
  const red = linearizeChannel(r);
  const green = linearizeChannel(g);
  const blue = linearizeChannel(b);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(
  foreground: RgbColor,
  background: RgbColor
): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getWcagResults(ratio: number): WcagResults {
  return {
    normalText: {
      aa: ratio >= 4.5,
      aaa: ratio >= 7
    },
    largeText: {
      aa: ratio >= 3,
      aaa: ratio >= 4.5
    }
  };
}

export function analyzeContrast(
  foreground: RgbColor,
  background: RgbColor
): ContrastResult {
  const ratio = contrastRatio(foreground, background);

  return {
    contrastRatio: roundToTwo(ratio),
    wcag: getWcagResults(ratio)
  };
}