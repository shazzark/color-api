import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type JsonObject = Record<string, unknown>;

export interface OpenApiMedia {
  schema?: JsonObject;
  example?: unknown;
}

export interface OpenApiResponse {
  description?: string;
  content?: Record<string, OpenApiMedia>;
  headers?: Record<string, JsonObject>;
}

export interface OpenApiParameter {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: JsonObject;
}

export interface OpenApiOperation {
  operationId: string;
  summary: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, OpenApiMedia>;
  };
  responses: Record<string, OpenApiResponse>;
}

export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: { schemas?: Record<string, JsonObject> };
  "x-cors-preflight"?: JsonObject;
}

export interface DocumentedOperation extends OpenApiOperation {
  method: string;
  path: string;
  category: "Color operation" | "Health endpoint" | "Documentation endpoint" | "Specification endpoint" | "Service endpoint";
}

// The checked-in root OpenAPI artifact is the reference source for this static site.
const source = readFileSync(resolve(process.cwd(), "..", "openapi.json"), "utf8");
export const openApiDocument = JSON.parse(source) as OpenApiDocument;

function categoryFor(method: string, path: string): DocumentedOperation["category"] {
  if (method === "GET" && path === "/health") return "Health endpoint";
  if (method === "GET" && path === "/docs") return "Documentation endpoint";
  if (method === "GET" && path === "/openapi.json") return "Specification endpoint";
  if (path.startsWith("/v1/")) return "Color operation";
  return "Service endpoint";
}

export function getDocumentedOperations(): DocumentedOperation[] {
  return Object.entries(openApiDocument.paths).flatMap(([path, pathItem]) =>
    Object.entries(pathItem)
      .filter(([method]) => ["get", "post", "put", "patch", "delete"].includes(method.toLowerCase()))
      .map(([method, operation]) => ({
        ...operation,
        method: method.toUpperCase(),
        path,
        category: categoryFor(method.toUpperCase(), path)
      }))
  );
}

export interface PlaygroundOperation {
  operationId: string;
  method: "POST";
  path: string;
  summary: string;
  description: string;
  requestExample: unknown;
}

export function getPlaygroundOperations(): PlaygroundOperation[] {
  return getDocumentedOperations()
    .filter((operation) => operation.method === "POST" && operation.path.startsWith("/v1/"))
    .map((operation) => {
      const jsonMedia = operation.requestBody?.content?.["application/json"];
      if (jsonMedia?.example === undefined) {
        throw new Error(`OpenAPI operation ${operation.operationId} has no documented JSON request example.`);
      }
      return {
        operationId: operation.operationId,
        method: "POST",
        path: operation.path,
        summary: operation.summary,
        description: operation.description ?? "",
        requestExample: jsonMedia.example
      };
    });
}

export function readPackageExample(fileName: "getting-started.ts" | "operations.ts" | "errors.ts" | "tokens.ts" | "react-example.tsx"): string {
  return readFileSync(resolve(process.cwd(), "features", "docs", "examples", fileName), "utf8");
}

export function getDocumentedLimits() {
  const description = openApiDocument.info.description;
  const bodyLimit = description.match(/JSON bodies default to ([\d,]+) bytes and can be configured from ([\d,]+) to ([\d,]+) bytes/);
  const rateLimit = description.match(/rate limit defaults to ([\d,]+) requests per socket IP per ([\d,]+) seconds/);
  if (!bodyLimit || !rateLimit) throw new Error("OpenAPI info.description is missing the documented request limits.");
  return {
    defaultBodyBytes: Number(bodyLimit[1].replaceAll(",", "")),
    minimumBodyBytes: Number(bodyLimit[2].replaceAll(",", "")),
    maximumBodyBytes: Number(bodyLimit[3].replaceAll(",", "")),
    requestsPerWindow: Number(rateLimit[1].replaceAll(",", "")),
    rateWindowSeconds: Number(rateLimit[2].replaceAll(",", ""))
  };
}
