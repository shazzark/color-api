import Fastify, { LogController } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { readApiConfig, type ApiConfig } from "./config.js";
import { InvalidColorError, InvalidRequestError, isColorFormat } from "./color/validation.js";
import { batchRoutes } from "./routes/batch.js";
import { colorRoutes } from "./routes/colors.js";
import { contrastRoutes } from "./routes/contrast.js";
import { healthRoutes } from "./routes/health.js";
import { paletteRoutes } from "./routes/palette.js";
import { operationRoutes } from "./routes/operations.js";
import { documentationRoutes } from "./routes/documentation.js";
import { tokenRoutes } from "./routes/tokens.js";
import { OPENAPI_SPEC, runtimeBodySchema } from "./openapi.js";

interface RateWindow { start: number; count: number }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function setCorsHeaders(request: FastifyRequest, reply: FastifyReply, config: ApiConfig): void {
  const origin = request.headers.origin;
  reply.header("vary", "Origin");
  if (typeof origin !== "string" || !config.corsOrigins.includes(origin)) return;
  reply.header("access-control-allow-origin", origin);
  reply.header("access-control-allow-methods", "GET, POST, OPTIONS");
  reply.header("access-control-allow-headers", "content-type");
  reply.header("access-control-expose-headers", "x-request-id, x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset, retry-after");
}

export function buildApp(config: ApiConfig = readApiConfig()) {
  const app = Fastify({
    logger: true,
    logController: new LogController({ disableRequestLogging: true }),
    bodyLimit: config.bodyLimitBytes,
    trustProxy: false,
    ajv: { customOptions: { coerceTypes: false, useDefaults: false, removeAdditional: false } },
    requestTimeout: config.requestTimeoutMs,
    connectionTimeout: config.connectionTimeoutMs,
    requestIdHeader: false,
    genReqId: () => randomUUID()
  });
  const rateWindows = new Map<string, RateWindow>();
  let requestsSinceCleanup = 0;

  app.addHook("onRoute", (route) => {
    const method = typeof route.method === "string" && route.method.toLowerCase() === "post"
      ? "post"
      : typeof route.method === "string" && route.method.toLowerCase() === "get"
        ? "get"
        : undefined;
    if (method === undefined) return;
    if (OPENAPI_SPEC.paths[route.url]?.[method] === undefined) {
      if (route.url.startsWith("/test/")) return;
      throw new Error(`Route ${method.toUpperCase()} ${route.url} is missing from the OpenAPI contract`);
    }
    const body = runtimeBodySchema(route.url, method);
    if (method === "post" && body === undefined) throw new Error(`Route ${route.url} has no OpenAPI request schema`);
    if (body !== undefined) {
      route.schema = { ...route.schema, body };
      route.attachValidation = true;
    }
  });

  app.addHook("onRequest", async (request, reply) => {
    setCorsHeaders(request, reply, config);
    reply.header("x-request-id", request.id);
    if (request.method === "OPTIONS") return;
    if ((request.method === "GET" || request.method === "HEAD") && request.url.split("?")[0] === "/health") return;

    const now = Date.now();
    if (requestsSinceCleanup >= 256) {
      for (const [key, window] of rateWindows) {
        if (now - window.start >= config.rateLimitWindowMs) rateWindows.delete(key);
      }
      requestsSinceCleanup = 0;
    }
    requestsSinceCleanup += 1;

    const configuredClientIp = config.rateLimitClientIpHeader === undefined
      ? undefined
      : request.headers[config.rateLimitClientIpHeader];
    const key = typeof configuredClientIp === "string" && isIP(configuredClientIp) !== 0
      ? configuredClientIp.toLowerCase()
      : request.ip;
    const current = rateWindows.get(key);
    const window = current === undefined || now - current.start >= config.rateLimitWindowMs
      ? { start: now, count: 0 }
      : current;
    window.count += 1;
    rateWindows.set(key, window);
    while (rateWindows.size > 10000) {
      const oldest = rateWindows.keys().next();
      if (oldest.done) break;
      rateWindows.delete(oldest.value);
    }
    reply.header("x-ratelimit-limit", config.rateLimitMax);
    reply.header("x-ratelimit-remaining", Math.max(0, config.rateLimitMax - window.count));
    reply.header("x-ratelimit-reset", Math.ceil((window.start + config.rateLimitWindowMs) / 1000));
    if (window.count > config.rateLimitMax) {
      const retryAfterSeconds = Math.max(1, Math.ceil((window.start + config.rateLimitWindowMs - now) / 1000));
      reply.header("retry-after", retryAfterSeconds);
      return reply.code(429).send({ error: { code: "RATE_LIMITED", message: "Request rate limit exceeded" } });
    }
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info({ method: request.method, route: request.routeOptions.url ?? "unmatched", statusCode: reply.statusCode }, "request completed");
  });

  app.options("/*", async (request, reply) => {
    if (request.headers.origin !== undefined
      && (typeof request.headers.origin !== "string" || !config.corsOrigins.includes(request.headers.origin))) {
      return reply.code(403).send({ error: { code: "CORS_ORIGIN_DENIED", message: "Origin is not allowed" } });
    }
    reply.header("vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
    reply.header("access-control-max-age", "600");
    return reply.code(204).send();
  });

  app.setNotFoundHandler(async (_request, reply) => reply.code(404).send({
    error: { code: "NOT_FOUND", message: "Route not found" }
  }));

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof InvalidColorError) {
      return reply.code(400).send({ error: { code: error.code, message: error.message, issues: error.issues } });
    }
    if (error instanceof InvalidRequestError) {
      return reply.code(400).send({ error: { code: error.code, message: error.message } });
    }
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error
      ? error.statusCode
      : undefined;
    const status = typeof statusCode === "number" && statusCode >= 400 && statusCode <= 599
      ? statusCode
      : 500;
    const code = status === 400 ? "INVALID_REQUEST"
      : status === 413 ? "PAYLOAD_TOO_LARGE"
        : status === 415 ? "UNSUPPORTED_MEDIA_TYPE"
          : status === 429 ? "RATE_LIMITED"
            : "INTERNAL_ERROR";
    const message = status === 400 ? "Malformed or invalid request"
      : status === 413 ? "Request body is too large"
        : status === 415 ? "Unsupported media type"
          : status >= 500 ? "Internal server error"
            : "Request could not be processed";
    if (status >= 500) request.log.error({ err: error }, "request failed");
    return reply.code(status).send({ error: { code, message } });
  });

  app.register(healthRoutes);
  app.register(colorRoutes);
  app.register(batchRoutes);
  app.register(contrastRoutes);
  app.register(paletteRoutes);
  app.register(tokenRoutes);
  app.register(operationRoutes);
  app.register(documentationRoutes);

  return app;
}
