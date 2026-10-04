export interface ApiConfig {
  host: string;
  port: number;
  bodyLimitBytes: number;
  corsOrigins: readonly string[];
  rateLimitMax: number;
  rateLimitWindowMs: number;
  requestTimeoutMs: number;
  connectionTimeoutMs: number;
}

export type Environment = Readonly<Record<string, string | undefined>>;

function boundedInteger(
  env: Environment, key: string, fallback: number, minimum: number, maximum: number
): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  if (!/^\d+$/.test(raw)) throw new Error(`${key} must be an integer from ${minimum} to ${maximum}`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${key} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function parseCorsOrigins(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") return [];
  const origins = raw.split(",").map((part) => part.trim());
  if (origins.some((origin) => origin === "" || origin === "*")) {
    throw new Error("CORS_ORIGINS must be a comma-separated list of explicit HTTP(S) origins");
  }
  for (const origin of origins) {
    let parsed: URL;
    try { parsed = new URL(origin); }
    catch { throw new Error("CORS_ORIGINS must contain valid origins"); }
    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:")
      || parsed.origin !== origin || parsed.username !== "" || parsed.password !== "") {
      throw new Error("CORS_ORIGINS entries must be explicit HTTP(S) origins without paths or credentials");
    }
  }
  return [...new Set(origins)];
}

export function readApiConfig(env: Environment = process.env): ApiConfig {
  const host = env.HOST ?? "0.0.0.0";
  if (host.trim() === "" || host !== host.trim() || /\s/.test(host)) throw new Error("HOST must be a valid bind host");
  return {
    host,
    port: boundedInteger(env, "PORT", 3000, 1, 65535),
    bodyLimitBytes: boundedInteger(env, "BODY_LIMIT_BYTES", 65536, 1024, 1048576),
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
    rateLimitMax: boundedInteger(env, "RATE_LIMIT_MAX", 120, 1, 10000),
    rateLimitWindowMs: boundedInteger(env, "RATE_LIMIT_WINDOW_MS", 60000, 1000, 3600000),
    requestTimeoutMs: boundedInteger(env, "REQUEST_TIMEOUT_MS", 30000, 1000, 120000),
    connectionTimeoutMs: boundedInteger(env, "CONNECTION_TIMEOUT_MS", 10000, 1000, 120000)
  };
}
