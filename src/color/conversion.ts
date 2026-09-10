import { validateHexColor } from "./validation.js";
import type {
  ColorFormat,
  ColorValue,
  HexColor,
  HslColor,
  HsvColor,
  RgbColor
} from "./types.js";
import { InvalidColorError } from "./validation.js";

export { InvalidColorError } from "./validation.js";

export function hexToRgb(value: HexColor): RgbColor {
  const validated = validateHexColor(value);
  const normalized = validated.startsWith("#")
    ? validated.slice(1)
    : validated;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

export function rgbToHex({ r, g, b }: RgbColor): HexColor {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: roundToTwo(lightness * 100) };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;

  if (max === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) {
    hue += 360;
  }

  return {
    h: roundToTwo(hue),
    s: roundToTwo(saturation * 100),
    l: roundToTwo(lightness * 100)
  };
}

export function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, v: roundToTwo(max * 100) };
  }

  const saturation = delta / max;
  let hue: number;

  if (max === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) {
    hue += 360;
  }

  return {
    h: roundToTwo(hue),
    s: roundToTwo(saturation * 100),
    v: roundToTwo(max * 100)
  };
}

function channelToRgb(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value * 255)));
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hue = normalizeHue(h) / 360;
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const second = chroma * (1 - Math.abs((hue * 6) % 2 - 1));
  const match = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 1 / 6) {
    red = chroma;
    green = second;
  } else if (hue < 2 / 6) {
    red = second;
    green = chroma;
  } else if (hue < 3 / 6) {
    green = chroma;
    blue = second;
  } else if (hue < 4 / 6) {
    green = second;
    blue = chroma;
  } else if (hue < 5 / 6) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  return {
    r: channelToRgb(red + match),
    g: channelToRgb(green + match),
    b: channelToRgb(blue + match)
  };
}

export function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
  const hue = normalizeHue(h) / 60;
  const saturation = s / 100;
  const value = v / 100;
  const chroma = value * saturation;
  const second = chroma * (1 - Math.abs((hue % 2) - 1));
  const match = value - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 1) {
    red = chroma;
    green = second;
  } else if (hue < 2) {
    red = second;
    green = chroma;
  } else if (hue < 3) {
    green = chroma;
    blue = second;
  } else if (hue < 4) {
    green = second;
    blue = chroma;
  } else if (hue < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  return {
    r: channelToRgb(red + match),
    g: channelToRgb(green + match),
    b: channelToRgb(blue + match)
  };
}

export function hexToHsl(value: HexColor): HslColor {
  return rgbToHsl(hexToRgb(value));
}

export function hexToHsv(value: HexColor): HsvColor {
  return rgbToHsv(hexToRgb(value));
}

export function hslToHex(value: HslColor): HexColor {
  return rgbToHex(hslToRgb(value));
}

export function hsvToHex(value: HsvColor): HexColor {
  return rgbToHex(hsvToRgb(value));
}

export function hslToHsv(value: HslColor): HsvColor {
  return rgbToHsv(hslToRgb(value));
}

export function hsvToHsl(value: HsvColor): HslColor {
  return rgbToHsl(hsvToRgb(value));
}

function toRgb(value: ColorValue): RgbColor {
  switch (value.format) {
    case "hex":
      return hexToRgb(value.value);
    case "rgb":
      return value.value;
    case "hsl":
      return hslToRgb(value.value);
    case "hsv":
      return hsvToRgb(value.value);
  }
}

export function convertColor(
  from: ColorFormat,
  to: ColorFormat,
  value: ColorValue
): ColorValue {
  if (value.format !== from) {
    throw new InvalidColorError("Color value format does not match request");
  }

  const rgb = toRgb(value);

  switch (to) {
    case "hex":
      return { format: "hex", value: rgbToHex(rgb) };
    case "rgb":
      return { format: "rgb", value: rgb };
    case "hsl":
      return { format: "hsl", value: rgbToHsl(rgb) };
    case "hsv":
      return { format: "hsv", value: rgbToHsv(rgb) };
  }
}
