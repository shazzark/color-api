import { describe, expect, it } from "vitest";
import { hexToRgb, InvalidColorError } from "../src/color/conversion.js";

describe("hexToRgb", () => {
  it("converts a six-digit HEX value", () => {
    expect(hexToRgb("#3498db")).toEqual({ r: 52, g: 152, b: 219 });
  });

  it("accepts uppercase HEX without a hash", () => {
    expect(hexToRgb("FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("converts black", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("rejects invalid HEX values", () => {
    expect(() => hexToRgb("#12fg45")).toThrow(InvalidColorError);
    expect(() => hexToRgb("#123")).toThrow(InvalidColorError);
  });
});
