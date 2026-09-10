import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("contrast API endpoint", () => {
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
      name: "HEX and HEX",
      foreground: { format: "hex", value: "#ffffff" },
      background: { format: "hex", value: "#000000" }
    },
    {
      name: "RGB and RGB",
      foreground: { format: "rgb", value: { r: 255, g: 255, b: 255 } },
      background: { format: "rgb", value: { r: 0, g: 0, b: 0 } }
    },
    {
      name: "HSL and HSL",
      foreground: { format: "hsl", value: { h: 0, s: 0, l: 100 } },
      background: { format: "hsl", value: { h: 0, s: 0, l: 0 } }
    },
    {
      name: "HSV and HSV",
      foreground: { format: "hsv", value: { h: 0, s: 0, v: 100 } },
      background: { format: "hsv", value: { h: 0, s: 0, v: 0 } }
    },
    {
      name: "mixed formats",
      foreground: { format: "rgb", value: { r: 255, g: 255, b: 255 } },
      background: { format: "hsl", value: { h: 0, s: 0, l: 0 } }
    }
  ])("accepts $name", async ({ foreground, background }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/contrast",
      payload: { foreground, background }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      foreground,
      background,
      contrastRatio: 21,
      wcag: {
        normalText: { aa: true, aaa: true },
        largeText: { aa: true, aaa: true }
      }
    });
  });

  it("returns the expected WCAG flags", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/contrast",
      payload: {
        foreground: { format: "hex", value: "#777777" },
        background: { format: "hex", value: "#ffffff" }
      }
    });

    expect(response.json()).toMatchObject({
      contrastRatio: 4.48,
      wcag: {
        normalText: { aa: false, aaa: false },
        largeText: { aa: true, aaa: false }
      }
    });
  });

  it.each([
    { payload: { background: { format: "hex", value: "#000000" } }, message: "Request must include foreground and background colors" },
    { payload: { foreground: { format: "hex", value: "#ffffff" } }, message: "Request must include foreground and background colors" },
    { payload: { foreground: {}, background: { format: "hex", value: "#000000" } }, message: "Invalid color value" },
    { payload: { foreground: { format: "hex", value: "#ffffff" }, background: {} }, message: "Invalid color value" },
    { payload: { foreground: { format: "rgb", value: { r: 256, g: 0, b: 0 } }, background: { format: "hex", value: "#000000" } }, message: "Invalid RGB color value" },
    { payload: { foreground: { format: "hsl", value: { h: 0, s: 101, l: 50 } }, background: { format: "hex", value: "#000000" } }, message: "Invalid HSL color value" },
    { payload: { foreground: { format: "hsv", value: { h: 0, s: 50, v: -1 } }, background: { format: "hex", value: "#000000" } }, message: "Invalid HSV color value" },
    { payload: { foreground: { format: "hex", value: "#123" }, background: { format: "hex", value: "#000000" } }, message: "Invalid HEX color value" },
    { payload: { foreground: { format: "cmyk", value: {} }, background: { format: "hex", value: "#000000" } }, message: "Invalid color format" }
  ])("rejects invalid requests", async ({ payload, message }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/contrast",
      payload
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: message.startsWith("Request") ? "INVALID_REQUEST" : "INVALID_COLOR",
        message
      }
    });
  });
});