import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

describe("public domain package barrel", () => {
  it("exposes framework-independent operation groups", () => {
    expect(api.convertColor({ format: "hex", value: "#3498db" }, "rgb").output.format).toBe("rgb");
    expect(api.generateColors(2, { seed: "barrel" }).colors).toHaveLength(2);
    expect(api.generateHslPalette({ h: 0, s: 50, l: 50 }, "tetradic")).toHaveLength(4);
    expect(api.createCssVariablesBlock({ brand: { format: "hex", value: "#3498db" } })).toContain("--color-brand");
    expect(api.analyzeColor({ format: "hex", value: "#3498db" }).relativeLuminance).toBeGreaterThan(0);
    expect("buildApp" in api).toBe(false);
  });
});
