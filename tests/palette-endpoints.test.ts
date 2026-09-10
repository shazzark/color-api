import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("palette API endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    "complementary",
    "analogous",
    "triadic",
    "split-complementary",
    "monochromatic"
  ])("supports the %s strategy", async (strategy) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/palette",
      payload: {
        base: { format: "hex", value: "#3498db" },
        strategy
      }
    });
    const body = response.json();
    const expectedLength = strategy === "complementary" ? 2
      : strategy === "monochromatic" ? 5
        : 3;

    expect(response.statusCode).toBe(200);
    expect(body.base).toEqual({ format: "hex", value: "#3498db" });
    expect(body.strategy).toBe(strategy);
    expect(body.outputFormat).toBe("hex");
    expect(body.colors).toHaveLength(expectedLength);
    expect(body.colors.every((color: { format: string; value: unknown }) =>
      color.format === "hex"
      && typeof color.value === "string"
      && /^#[\da-f]{6}$/.test(color.value)
    )).toBe(true);
  });

  it.each([
    {
      outputFormat: "hex",
      expectedFormat: "hex",
      expectedValueType: "string"
    },
    {
      outputFormat: "rgb",
      expectedFormat: "rgb",
      expectedValueType: "object"
    },
    {
      outputFormat: "hsl",
      expectedFormat: "hsl",
      expectedValueType: "object"
    },
    {
      outputFormat: "hsv",
      expectedFormat: "hsv",
      expectedValueType: "object"
    }
  ])("supports $outputFormat output", async ({ outputFormat, expectedFormat, expectedValueType }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/palette",
      payload: {
        base: { format: "rgb", value: { r: 52, g: 152, b: 219 } },
        strategy: "complementary",
        outputFormat
      }
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.outputFormat).toBe(outputFormat);
    expect(body.colors).toHaveLength(2);
    expect(body.colors.every((color: { format: string; value: unknown }) =>
      color.format === expectedFormat
      && typeof color.value === expectedValueType
    )).toBe(true);
  });

  it("supports HSL, HSV, and mixed input/output formats", async () => {
    const hslResponse = await app.inject({
      method: "POST",
      url: "/v1/colors/palette",
      payload: {
        base: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
        strategy: "analogous",
        outputFormat: "hsv"
      }
    });
    const hsvResponse = await app.inject({
      method: "POST",
      url: "/v1/colors/palette",
      payload: {
        base: { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } },
        strategy: "triadic",
        outputFormat: "hsl"
      }
    });

    expect(hslResponse.statusCode).toBe(200);
    expect(hslResponse.json().base).toEqual({
      format: "hsl",
      value: { h: 204.07, s: 69.87, l: 53.14 }
    });
    expect(hslResponse.json().colors.every((color: { format: string }) =>
      color.format === "hsv"
    )).toBe(true);
    expect(hsvResponse.statusCode).toBe(200);
    expect(hsvResponse.json().base).toEqual({
      format: "hsv",
      value: { h: 204.07, s: 76.26, v: 85.88 }
    });
    expect(hsvResponse.json().colors.every((color: { format: string }) =>
      color.format === "hsl"
    )).toBe(true);
  });

  it("preserves equivalent palette results across input formats", async () => {
    const requests = [
      { format: "hex", value: "#3498db" },
      { format: "rgb", value: { r: 52, g: 152, b: 219 } },
      { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
      { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } }
    ];
    const responses = await Promise.all(requests.map((base) => app.inject({
      method: "POST",
      url: "/v1/colors/palette",
      payload: { base, strategy: "complementary" }
    })));

    for (const response of responses) {
      expect(response.statusCode).toBe(200);
      expect(response.json().colors).toEqual([
        { format: "hex", value: "#3498db" },
        { format: "hex", value: "#db7734" }
      ]);
    }
  });

  it("rounds HSL output and keeps RGB channels integral", async () => {
    const hslResponse = await app.inject({
      method: "POST",
      url: "/v1/colors/palette",
      payload: {
        base: { format: "hex", value: "#3498db" },
        strategy: "complementary",
        outputFormat: "hsl"
      }
    });
    const rgbResponse = await app.inject({
      method: "POST",
      url: "/v1/colors/palette",
      payload: {
        base: { format: "hex", value: "#3498db" },
        strategy: "complementary",
        outputFormat: "rgb"
      }
    });

    expect(hslResponse.json().colors).toEqual([
      { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
      { format: "hsl", value: { h: 24.07, s: 69.87, l: 53.14 } }
    ]);
    expect(rgbResponse.json().colors.every((color: {
      format: string;
      value: { r: number; g: number; b: number };
    }) => color.format === "rgb"
      && Number.isInteger(color.value.r)
      && Number.isInteger(color.value.g)
      && Number.isInteger(color.value.b)
    )).toBe(true);
  });

  it.each([
    {
      payload: {},
      code: "INVALID_REQUEST",
      message: "Request must include base and strategy"
    },
    {
      payload: {
        base: { format: "hex", value: "#ffffff" }
      },
      code: "INVALID_REQUEST",
      message: "Request must include base and strategy"
    },
    {
      payload: {
        base: { value: "#ffffff" },
        strategy: "analogous"
      },
      code: "INVALID_COLOR",
      message: "Invalid base color value"
    },
    {
      payload: {
        base: { format: "hex" },
        strategy: "analogous"
      },
      code: "INVALID_COLOR",
      message: "Invalid base color value"
    },
    {
      payload: {
        base: { format: "hex", value: "#123" },
        strategy: "analogous"
      },
      code: "INVALID_COLOR",
      message: "Invalid HEX color value"
    },
    {
      payload: {
        base: { format: "rgb", value: { r: 256, g: 0, b: 0 } },
        strategy: "analogous"
      },
      code: "INVALID_COLOR",
      message: "Invalid RGB color value"
    },
    {
      payload: {
        base: { format: "hsl", value: { h: 0, s: 101, l: 50 } },
        strategy: "analogous"
      },
      code: "INVALID_COLOR",
      message: "Invalid HSL color value"
    },
    {
      payload: {
        base: { format: "hsv", value: { h: 0, s: 50, v: -1 } },
        strategy: "analogous"
      },
      code: "INVALID_COLOR",
      message: "Invalid HSV color value"
    },
    {
      payload: {
        base: { format: "cmyk", value: {} },
        strategy: "analogous"
      },
      code: "INVALID_COLOR",
      message: "Invalid base color value"
    },
    {
      payload: {
        base: { format: "hex", value: "#ffffff" },
        strategy: "unknown"
      },
      code: "INVALID_REQUEST",
      message: "Invalid palette strategy"
    },
    {
      payload: {
        base: { format: "hex", value: "#ffffff" },
        strategy: "analogous",
        outputFormat: "cmyk"
      },
      code: "INVALID_REQUEST",
      message: "Invalid output format"
    }
  ])("returns stable errors", async ({ payload, code, message }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/palette",
      payload
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: { code, message } });
  });
});
