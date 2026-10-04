import { afterAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { readApiConfig } from "../src/config.js";

describe("API configuration and transport hardening", () => {
  it("rejects invalid bind, port, and wildcard CORS configuration", () => {
    expect(() => readApiConfig({ PORT: "0" })).toThrow();
    expect(() => readApiConfig({ HOST: "bad host" })).toThrow();
    expect(() => readApiConfig({ CORS_ORIGINS: "*" })).toThrow();
    expect(() => readApiConfig({ RATE_LIMIT_CLIENT_IP_HEADER: "not a header" })).toThrow();
  });

  it("uses request IDs, exact CORS origins, stable errors, and a bounded rate limit", async () => {
    const config = { ...readApiConfig({}), corsOrigins: ["https://client.example"], rateLimitMax: 5, bodyLimitBytes: 1024 };
    const app: FastifyInstance = buildApp(config);
    await app.ready();
    try {
      const first = await app.inject({ method: "GET", url: "/missing", headers: { "x-request-id": "attacker-value" } });
      const second = await app.inject({ method: "GET", url: "/missing" });
      expect(first.statusCode).toBe(404);
      expect(first.headers["x-request-id"]).not.toBe("attacker-value");
      expect(second.headers["x-request-id"]).not.toBe(first.headers["x-request-id"]);
      expect(first.json()).toEqual({ error: { code: "NOT_FOUND", message: "Route not found" } });

      const cors = await app.inject({ method: "OPTIONS", url: "/v1/colors/convert", headers: { origin: "https://client.example" } });
      expect(cors.statusCode).toBe(204);
      expect(cors.headers["access-control-allow-origin"]).toBe("https://client.example");
      expect(cors.headers["access-control-expose-headers"]).toContain("x-request-id");
      const denied = await app.inject({ method: "OPTIONS", url: "/v1/colors/convert", headers: { origin: "https://evil.example" } });
      expect(denied.statusCode).toBe(403);

      const tooLarge = await app.inject({ method: "POST", url: "/v1/colors/generate", payload: "x".repeat(1500), headers: { "content-type": "application/json" } });
      expect(tooLarge.statusCode).toBe(413);
      expect(tooLarge.json().error.code).toBe("PAYLOAD_TOO_LARGE");
      const malformed = await app.inject({ method: "POST", url: "/v1/colors/convert", payload: "{", headers: { "content-type": "application/json" } });
      expect(malformed.statusCode).toBe(400);
      expect(malformed.json()).toEqual({ error: { code: "INVALID_REQUEST", message: "Malformed or invalid request" } });
      const unsupported = await app.inject({ method: "POST", url: "/v1/colors/convert", payload: "{}", headers: { "content-type": "application/xml" } });
      expect(unsupported.statusCode).toBe(415);
      expect(unsupported.json()).toEqual({ error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Unsupported media type" } });
      await app.inject({ method: "GET", url: "/health" });
      await app.inject({ method: "GET", url: "/health" });
      await app.inject({ method: "GET", url: "/health" });
      const limited = await app.inject({ method: "GET", url: "/missing" });
      expect(limited.statusCode).toBe(429);
      expect(limited.headers["retry-after"]).toBeDefined();
      expect(limited.json().error.code).toBe("RATE_LIMITED");
    } finally { await app.close(); }
  });

  it("redacts unexpected server errors", async () => {
    const app = buildApp();
    app.get("/test/internal-error", async () => { throw new Error("private detail"); });
    await app.ready();
    try {
      const response = await app.inject({ method: "GET", url: "/test/internal-error" });
      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain("private detail");
      expect(response.json().error.code).toBe("INTERNAL_ERROR");
    } finally { await app.close(); }
  });

  it("uses only a valid configured trusted client-IP header as the limiter key", async () => {
    const config = {
      ...readApiConfig({ RATE_LIMIT_CLIENT_IP_HEADER: "X-Color-API-Client-IP" }),
      rateLimitMax: 1
    };
    const app = buildApp(config);
    await app.ready();
    try {
      const firstIp = { "x-color-api-client-ip": "198.51.100.7" };
      const first = await app.inject({ method: "GET", url: "/missing", headers: firstIp });
      const otherClient = await app.inject({ method: "GET", url: "/missing", headers: { "x-color-api-client-ip": "203.0.113.9" } });
      const blocked = await app.inject({ method: "GET", url: "/missing", headers: firstIp });
      expect(first.statusCode).toBe(404);
      expect(otherClient.statusCode).toBe(404);
      expect(blocked.statusCode).toBe(429);

      const malformedHeader = await app.inject({ method: "GET", url: "/missing", headers: { "x-color-api-client-ip": "not-an-ip" } });
      expect(malformedHeader.statusCode).toBe(404);
      const malformedHeaderAgain = await app.inject({ method: "GET", url: "/missing", headers: { "x-color-api-client-ip": "not-an-ip" } });
      expect(malformedHeaderAgain.statusCode).toBe(429);
    } finally { await app.close(); }
  });
});
