import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("API endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns a health status", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it.each([
    {
      from: "hex",
      to: "rgb",
      value: "#3498db",
      output: { format: "rgb", value: { r: 52, g: 152, b: 219 } }
    },
    {
      from: "hex",
      to: "hsl",
      value: "#3498db",
      output: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } }
    },
    {
      from: "hex",
      to: "hsv",
      value: "#3498db",
      output: { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } }
    },
    {
      from: "rgb",
      to: "hex",
      value: { r: 52, g: 152, b: 219 },
      output: { format: "hex", value: "#3498db" }
    },
    {
      from: "rgb",
      to: "hsl",
      value: { r: 52, g: 152, b: 219 },
      output: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } }
    },
    {
      from: "rgb",
      to: "hsv",
      value: { r: 52, g: 152, b: 219 },
      output: { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } }
    },
    {
      from: "hsl",
      to: "rgb",
      value: { h: 204.07, s: 69.87, l: 53.14 },
      output: { format: "rgb", value: { r: 52, g: 152, b: 219 } }
    },
    {
      from: "hsl",
      to: "hex",
      value: { h: 204.07, s: 69.87, l: 53.14 },
      output: { format: "hex", value: "#3498db" }
    },
    {
      from: "hsl",
      to: "hsv",
      value: { h: 204.07, s: 69.87, l: 53.14 },
      output: { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } }
    },
    {
      from: "hsv",
      to: "rgb",
      value: { h: 204.07, s: 76.26, v: 85.88 },
      output: { format: "rgb", value: { r: 52, g: 152, b: 219 } }
    },
    {
      from: "hsv",
      to: "hex",
      value: { h: 204.07, s: 76.26, v: 85.88 },
      output: { format: "hex", value: "#3498db" }
    },
    {
      from: "hsv",
      to: "hsl",
      value: { h: 204.07, s: 76.26, v: 85.88 },
      output: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } }
    }
  ])("converts $from to $to", async ({ from, to, value, output }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/convert",
      payload: { from, to, value }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      input: { format: from, value },
      output
    });
  });

  it("rejects malformed request envelopes", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/convert",
      payload: { from: "rgb", to: "hex" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Request must include string fields: from, to, and value"
      }
    });
  });

  it.each([
    { from: "rgb", to: "hex", value: { r: 256, g: 0, b: 0 }, message: "Invalid RGB color value" },
    { from: "hsl", to: "rgb", value: { h: 0, s: 101, l: 50 }, message: "Invalid HSL color value" },
    { from: "hsv", to: "rgb", value: { h: 0, s: 50, v: -1 }, message: "Invalid HSV color value" },
    { from: "rgb", to: "hex", value: { r: 0, g: 0 }, message: "Invalid RGB color value" }
  ])("rejects invalid $from values", async ({ from, to, value, message }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/convert",
      payload: { from, to, value }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: "INVALID_COLOR", message }
    });
  });

  it("rejects unsupported formats and same-format conversions", async () => {
    const unsupported = await app.inject({
      method: "POST",
      url: "/v1/colors/convert",
      payload: { from: "cmyk", to: "rgb", value: {} }
    });
    const sameFormat = await app.inject({
      method: "POST",
      url: "/v1/colors/convert",
      payload: { from: "rgb", to: "rgb", value: { r: 0, g: 0, b: 0 } }
    });

    expect(unsupported.statusCode).toBe(400);
    expect(sameFormat.statusCode).toBe(400);
    expect(unsupported.json()).toEqual({
      error: {
        code: "UNSUPPORTED_CONVERSION",
        message: "Supported conversions are between HEX, RGB, HSL, and HSV"
      }
    });
    expect(sameFormat.json()).toEqual(unsupported.json());
  });
});
