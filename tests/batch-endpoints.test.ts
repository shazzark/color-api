import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("batch conversion API endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("converts mixed input formats in input order", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/batch/convert",
      payload: {
        colors: [
          { format: "hex", value: "#3498db" },
          { format: "rgb", value: { r: 231, g: 76, b: 60 } },
          { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
          { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } }
        ],
        outputFormat: "hsl"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      results: [
        {
          input: { format: "hex", value: "#3498db" },
          output: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
          gamutMapped: false
        },
        {
          input: { format: "rgb", value: { r: 231, g: 76, b: 60 } },
          output: { format: "hsl", value: { h: 5.61, s: 78.08, l: 57.06 } },
          gamutMapped: false
        },
        {
          input: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
          output: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
          gamutMapped: false
        },
        {
          input: { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } },
          output: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.13 } },
          gamutMapped: false
        }
      ]
    });
  });

  it("defaults outputFormat to HEX", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/batch/convert",
      payload: {
        colors: [
          { format: "rgb", value: { r: 52, g: 152, b: 219 } },
          { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } }
        ]
      }
    });

    expect(response.json()).toEqual({
      results: [
        {
          input: { format: "rgb", value: { r: 52, g: 152, b: 219 } },
          output: { format: "hex", value: "#3498db" },
          gamutMapped: false
        },
        {
          input: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } },
          output: { format: "hex", value: "#3498db" },
          gamutMapped: false
        }
      ]
    });
  });

  it.each([
    {
      outputFormat: "rgb",
      outputs: [
        { format: "rgb", value: { r: 52, g: 152, b: 219 } },
        { format: "rgb", value: { r: 0, g: 255, b: 0 } }
      ]
    },
    {
      outputFormat: "hsv",
      outputs: [
        { format: "hsv", value: { h: 204.07, s: 76.26, v: 85.88 } },
        { format: "hsv", value: { h: 120, s: 100, v: 100 } }
      ]
    }
  ])("supports explicit $outputFormat output", async ({ outputFormat, outputs }) => {
    const colors = [
      { format: "hex", value: "#3498db" },
      { format: "hsl", value: { h: 120, s: 100, l: 50 } }
    ];
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/batch/convert",
      payload: { colors, outputFormat }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      results: [
        { input: colors[0], output: outputs[0], gamutMapped: false },
        { input: colors[1], output: outputs[1], gamutMapped: false }
      ]
    });
  });

  it("accepts a single item and exactly 100 items", async () => {
    const single = await app.inject({
      method: "POST",
      url: "/v1/colors/batch/convert",
      payload: { colors: [{ format: "hex", value: "#000000" }] }
    });
    const maximum = await app.inject({
      method: "POST",
      url: "/v1/colors/batch/convert",
      payload: {
        colors: Array.from({ length: 100 }, () => ({
          format: "hex",
          value: "#ffffff"
        }))
      }
    });

    expect(single.statusCode).toBe(200);
    expect(single.json().results).toHaveLength(1);
    expect(maximum.statusCode).toBe(200);
    expect(maximum.json().results).toHaveLength(100);
  });

  it.each([
    { payload: {}, message: "Request must include a colors array" },
    { payload: { colors: "#3498db" }, message: "Request must include a colors array" },
    { payload: { colors: [] }, message: "Colors must contain between 1 and 100 items" },
    { payload: { colors: Array.from({ length: 101 }, () => ({ format: "hex", value: "#ffffff" })) }, message: "Colors must contain between 1 and 100 items" },
    { payload: { colors: [{ format: "hex", value: "#ffffff" }], outputFormat: "cmyk" }, message: "Invalid output format" },
    { payload: { colors: [{ format: "hex", value: "#ffffff" }], outputFormat: 1 }, message: "Invalid output format" }
  ])("rejects malformed batch requests", async ({ payload, message }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/batch/convert",
      payload
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: "INVALID_REQUEST", message }
    });
  });

  it.each([
    { name: "null", color: null },
    { name: "string", color: "#3498db" },
    { name: "number", color: 42 },
    { name: "boolean", color: true },
    { name: "array", color: [] },
    { name: "object missing format", color: { value: "#3498db" } }
  ])("rejects a $name item without partial results", async ({ color }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/batch/convert",
      payload: {
        colors: [
          { format: "hex", value: "#ffffff" },
          color,
          { format: "hex", value: "#000000" }
        ]
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "INVALID_COLOR",
        message: "Invalid color value",
        index: 1
      }
    });
    expect(response.json().error.issues).toEqual([
      { code: "INVALID_COLOR", path: "/colors/1/value", message: "Invalid color value", index: 1 }
    ]);
  });

  it.each([
    {
      index: 0,
      color: { format: "hex", value: "#123" },
      message: "Invalid HEX color value"
    },
    {
      index: 1,
      color: { format: "rgb", value: { r: 256, g: 0, b: 0 } },
      message: "Invalid RGB color value"
    },
    {
      index: 1,
      color: { format: "hsl", value: { h: 0, s: 101, l: 50 } },
      message: "Invalid HSL color value"
    },
    {
      index: 1,
      color: { format: "hsv", value: { h: 0, s: 50, v: -1 } },
      message: "Invalid HSV color value"
    },
    {
      index: 1,
      color: { format: "cmyk", value: {} },
      message: "Invalid color value"
    },
    {
      index: 1,
      color: { format: "hex" },
      message: "Invalid color value"
    }
  ])("fails atomically for an invalid item at index $index", async ({ index, color, message }) => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/batch/convert",
      payload: {
        colors: index === 0
          ? [color, { format: "hex", value: "#000000" }]
          : [
              { format: "hex", value: "#ffffff" },
              color,
              { format: "hex", value: "#000000" }
            ]
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "INVALID_COLOR", message, index }
    });
    expect(response.json().error.issues).toEqual([
      { code: "INVALID_COLOR", path: `/colors/${index}/value`, message, index }
    ]);
    expect(response.json()).not.toHaveProperty("results");
  });
});
