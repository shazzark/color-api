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

  it("converts HEX to RGB", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/convert",
      payload: { from: "hex", to: "rgb", value: "#3498db" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      input: { format: "hex", value: "#3498db" },
      output: { format: "rgb", value: { r: 52, g: 152, b: 219 } }
    });
  });

  it("rejects malformed colors", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/convert",
      payload: { from: "hex", to: "rgb", value: "#123" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: "INVALID_COLOR", message: "Invalid HEX color value" }
    });
  });

  it("rejects unsupported conversions", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/colors/convert",
      payload: { from: "rgb", to: "hex", value: "#3498db" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "UNSUPPORTED_CONVERSION",
        message: "Only HEX to RGB conversion is supported"
      }
    });
  });
});
