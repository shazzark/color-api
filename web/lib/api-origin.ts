import { CHROMAFORGE_API_ORIGIN } from "./api-origin-constants";

export type ApiOriginEnvironment = "development" | "preview" | "production";

export type ApiOriginConfiguration =
  | { available: true; origin: string; source: "configured"; environment: ApiOriginEnvironment }
  | { available: false; origin: ""; message: string; environment: ApiOriginEnvironment };

function isLoopbackHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isApprovedApiUrl(url: URL, environment: ApiOriginEnvironment): boolean {
  if (url.origin === CHROMAFORGE_API_ORIGIN) return true;
  return environment === "development"
    && (url.protocol === "http:" || url.protocol === "https:")
    && isLoopbackHostname(url.hostname);
}

export function resolveApiOrigin(setting: string | undefined, environment: ApiOriginEnvironment): ApiOriginConfiguration {
  // Missing and blank values intentionally keep static preview/development builds offline.
  if (setting === undefined || setting.trim() === "") {
    return { available: false, origin: "", message: "No API origin is configured for this website build.", environment };
  }

  try {
    const url = new URL(setting);
    if ((url.protocol !== "https:" && url.protocol !== "http:")
      || url.username !== ""
      || url.password !== ""
      || url.pathname !== "/"
      || url.search !== ""
      || url.hash !== ""
      || !isApprovedApiUrl(url, environment)) {
      return { available: false, origin: "", message: "The configured API address must be the approved HTTPS API origin, or a loopback origin in development.", environment };
    }
    return { available: true, origin: url.origin, source: "configured", environment };
  } catch {
    return { available: false, origin: "", message: "The configured API address is not a valid HTTP(S) origin.", environment };
  }
}

function getApiOriginEnvironment(): ApiOriginEnvironment {
  if (process.env.VERCEL_ENV === "preview") return "preview";
  if (process.env.NODE_ENV === "development") return "development";
  return "production";
}

export const apiOriginConfiguration = resolveApiOrigin(
  process.env.NEXT_PUBLIC_CHROMAFORGE_API_ORIGIN,
  getApiOriginEnvironment()
);
