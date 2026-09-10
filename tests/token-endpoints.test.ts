import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("token API endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    {
      name: "HEX to HEX",
      payload: {
        name: "brand",
        color: { format: "hex", value: "#3498db" },
        outputFormat: "hex"
      },
      expectedColor: { format: "hex", value: "#3498db" },
      expectedCss: "#3498db"
    },
    {
      name: "RGB to RGB",
      payload: {
        name: "brand",
        color: { format: "rgb", value: { r: 52, g: 152, b: 219 } },
        outputFormat: "rgb"
      },
      expectedColor: { format: "rgb", value: { r: 52, g: 152, b: 219 } },
      expectedCss: "rgb(52, 152, 219)"
    },
    {
      name: "HSL to HSL",
      payload: {
        name: "brand",
        color: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
        outputFormat: "hsl"
      },
      expectedColor: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
      expectedCss: "hsl(204.07, 69.87%, 53.14%)"
    },
    {
      name: "HSV to HSV",
      payload: {
        name: "brand",
        color: { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } },
        outputFormat: "hsv"
      },
      expectedColor: { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } },
      expectedCss: "rgb(52, 152, 219)"
    },
    {
      name: "HEX to RGB",
      payload: {
        name: "brand",
        color: { format: "hex", value: "#3498db" },
        outputFormat: "rgb"
      },
      expectedColor: { format: "rgb", value: { r: 52, g: 152, b: 219 } },
      expectedCss: "rgb(52, 152, 219)"
    },
    {
      name: "HEX to HSL",
      payload: {
        name: "brand",
        color: { format: "hex", value: "#3498db" },
        outputFormat: "hsl"
      },
      expectedColor: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
      expectedCss: "hsl(204.07, 69.87%, 53.14%)"
    },
    {
      name: "HEX to HSV",
      payload: {
        name: "brand",
        color: { format: "hex", value: "#3498db" },
        outputFormat: "hsv"
      },
      expectedColor: { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } },
      expectedCss: "rgb(52, 152, 219)"
    }
  ])("supports $name", async ({ payload, expectedColor, expectedCss }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/tokens",
      payload
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      token: {
        name: "brand",
        color: expectedColor,
        cssVariable: "--color-brand",
        cssValue: expectedCss
      },
      css: `:root {\n  --color-brand: ${expectedCss};\n}`
    });
  });

  it("defaults outputFormat to HEX", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/tokens",
      payload: {
        name: "surface-muted",
        color: { format: "rgb", value: { r: 52, g: 152, b: 219 } }
      }
    });

    expect(response.json()).toEqual({
      token: {
        name: "surface-muted",
        color: { format: "hex", value: "#3498db" },
        cssVariable: "--color-surface-muted",
        cssValue: "#3498db"
      },
      css: ":root {\n  --color-surface-muted: #3498db;\n}"
    });
  });

  it.each([
    { payload: {}, code: "INVALID_REQUEST", message: "Request must include name and color" },
    { payload: { name: "brand" }, code: "INVALID_REQUEST", message: "Request must include name and color" },
    { payload: { color: { format: "hex", value: "#ffffff" } }, code: "INVALID_REQUEST", message: "Request must include name and color" },
    { payload: { name: "Brand", color: { format: "hex", value: "#ffffff" } }, code: "INVALID_REQUEST", message: "Invalid token name" },
    { payload: { name: "brand", color: {} }, code: "INVALID_REQUEST", message: "Invalid color envelope" },
    { payload: { name: "brand", color: { format: "hex" } }, code: "INVALID_REQUEST", message: "Invalid color envelope" },
    { payload: { name: "brand", color: { format: "hex", value: "#123" } }, code: "INVALID_COLOR", message: "Invalid HEX color value" },
    { payload: { name: "brand", color: { format: "rgb", value: { r: 256, g: 0, b: 0 } } }, code: "INVALID_COLOR", message: "Invalid RGB color value" },
    { payload: { name: "brand", color: { format: "hsl", value: { h: 0, s: 101, l: 50 } } }, code: "INVALID_COLOR", message: "Invalid HSL color value" },
    { payload: { name: "brand", color: { format: "hsv", value: { h: 0, s: 50, v: -1 } } }, code: "INVALID_COLOR", message: "Invalid HSV color value" },
    { payload: { name: "brand", color: { format: "hex", value: "#ffffff" }, outputFormat: "cmyk" }, code: "INVALID_REQUEST", message: "Invalid output format" }
  ])("returns $code for invalid input", async ({ payload, code, message }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/tokens",
      payload
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: { code, message } });
  });
});
