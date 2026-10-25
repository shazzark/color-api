import type { PlaygroundOperation } from "@/lib/openapi-source";
import { CHROMAFORGE_API_ORIGIN } from "@/lib/api-origin-constants";
import type { ApiOriginEnvironment } from "@/lib/api-origin";

export const API_REQUEST_TIMEOUT_MS = 15_000;
export const API_RESPONSE_LIMIT_BYTES = 1_048_576;

export class ResponseTooLargeError extends Error {
  public constructor(public readonly limitBytes: number) {
    super(`The API response exceeded the ${limitBytes.toLocaleString()} byte display limit.`);
    this.name = "ResponseTooLargeError";
  }
}

function isApprovedApiOrigin(origin: string, environment: ApiOriginEnvironment): boolean {
  try {
    const url = new URL(origin);
    const isConfiguredApi = url.origin === CHROMAFORGE_API_ORIGIN;
    const isLoopback = environment === "development"
      && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      && (url.protocol === "http:" || url.protocol === "https:");
    return url.origin === origin && url.pathname === "/" && url.search === "" && url.hash === ""
      && url.username === "" && url.password === "" && (isConfiguredApi || isLoopback);
  } catch {
    return false;
  }
}

export function parseJsonRequest(source: string, maxBytes: number): { valid: true; value: unknown; bytes: number } | { valid: false; message: string; bytes: number } {
  const bytes = new TextEncoder().encode(source).byteLength;
  if (bytes > maxBytes) return { valid: false, message: `Request body is ${bytes.toLocaleString()} bytes; the documented default limit is ${maxBytes.toLocaleString()} bytes.`, bytes };
  try {
    return { valid: true, value: JSON.parse(source) as unknown, bytes };
  } catch {
    return { valid: false, message: "Request body is not valid JSON.", bytes };
  }
}

export function buildOperationUrl(origin: string, operation: PlaygroundOperation, environment: ApiOriginEnvironment): string {
  if (!isApprovedApiOrigin(origin, environment)
    || operation.method !== "POST"
    || !/^\/v1\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(operation.path)) {
    throw new Error("Only documented POST /v1 operations at an approved API origin can be sent from the playground.");
  }
  const target = new URL(operation.path, `${origin}/`);
  if (target.origin !== origin || target.pathname !== operation.path) {
    throw new Error("The documented operation did not resolve to the configured API origin.");
  }
  return target.toString();
}

export async function readBoundedResponse(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new ResponseTooLargeError(maxBytes);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export function parseResponseBody(contentType: string, text: string): { isJson: boolean; value?: unknown; invalidJson: boolean } {
  if (!/(?:application|text)\/(?:[^;]+\+)?json/i.test(contentType)) return { isJson: false, invalidJson: false };
  try {
    return { isJson: true, value: JSON.parse(text) as unknown, invalidJson: false };
  } catch {
    return { isJson: true, invalidJson: true };
  }
}

export function buildRequestSnippets(url: string, body: unknown, environment: ApiOriginEnvironment) {
  const target = new URL(url);
  if (!isApprovedApiOrigin(target.origin, environment)
    || !/^\/v1\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(target.pathname)
    || target.search !== ""
    || target.hash !== ""
    || target.username !== ""
    || target.password !== "") {
    throw new Error("Only documented POST /v1 operations at an approved API origin can be shown as examples.");
  }
  const compactBody = JSON.stringify(body);
  if (compactBody === undefined) throw new Error("A JSON request body is required for this operation.");
  const shellBody = compactBody.replaceAll("'", "'\\''");
  return {
    fetch: `const response = await fetch(${JSON.stringify(url)}, {\n  method: "POST",\n  redirect: "error",\n  headers: { "content-type": "application/json" },\n  body: JSON.stringify(${compactBody})\n});\n\nconsole.log(response.status, await response.json());`,
    curl: `curl --request POST ${`'${url}'`} \\\n  --header 'content-type: application/json' \\\n  --data-raw '${shellBody}'`
  };
}
