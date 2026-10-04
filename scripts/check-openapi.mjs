import { readFile } from "node:fs/promises";
import AjvModule from "ajv";
import { createConfig, lintFromString } from "@redocly/openapi-core";
import { buildApp } from "../dist/src/app.js";
import { OPENAPI_SPEC, runtimeBodySchema } from "../dist/src/openapi.js";

const contract = JSON.parse(await readFile(new URL("../openapi.json", import.meta.url), "utf8"));
if (JSON.stringify(contract) !== JSON.stringify(OPENAPI_SPEC)) {
  throw new Error("openapi.json is stale; run npm run openapi:generate");
}
if (contract.openapi !== "3.1.0") throw new Error("Expected an OpenAPI 3.1.0 contract");
const redoclyConfig = await createConfig({ extends: ["minimal"] });
const lintProblems = await lintFromString({ source: JSON.stringify(contract), absoluteRef: new URL("../openapi.json", import.meta.url).href, config: redoclyConfig });
const lintErrors = lintProblems.filter((problem) => problem.severity === "error");
if (lintErrors.length > 0) throw new Error(`Invalid OpenAPI document:\n${JSON.stringify(lintErrors, null, 2)}`);
function inlineSchema(schema, seen = new Set()) {
  if (Array.isArray(schema)) return schema.map((item) => inlineSchema(item, seen));
  if (typeof schema !== "object" || schema === null) return schema;
  if (typeof schema.$ref === "string") {
    const name = schema.$ref.slice("#/components/schemas/".length);
    if (!schema.$ref.startsWith("#/components/schemas/") || seen.has(name) || contract.components.schemas[name] === undefined) {
      throw new Error(`Unsupported or unresolved schema reference: ${schema.$ref}`);
    }
    return inlineSchema(contract.components.schemas[name], new Set(seen).add(name));
  }
  return Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, inlineSchema(value, seen)]));
}
const Ajv = AjvModule.default ?? AjvModule;
const ajv = new Ajv({ allErrors: true, strict: false });

const operationIds = new Set();
function checkReferences(value) {
  if (Array.isArray(value)) {
    for (const item of value) checkReferences(item);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  if (typeof value.$ref === "string") {
    const prefix = "#/components/schemas/";
    if (!value.$ref.startsWith(prefix) || !(value.$ref.slice(prefix.length) in contract.components.schemas)) {
      throw new Error(`Unresolved OpenAPI reference: ${value.$ref}`);
    }
  }
  for (const item of Object.values(value)) checkReferences(item);
}
checkReferences(contract);

const app = buildApp();
try {
  await app.ready();
  for (const [path, methods] of Object.entries(contract.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (operationIds.has(operation.operationId)) throw new Error(`Duplicate operationId: ${operation.operationId}`);
      operationIds.add(operation.operationId);
      if (!app.hasRoute({ method: method.toUpperCase(), url: path })) throw new Error(`Documented route is not registered: ${method.toUpperCase()} ${path}`);
      if (method === "post" && operation.requestBody?.content?.["application/json"]?.schema === undefined) {
        throw new Error(`POST route is missing a request schema: ${path}`);
      }
      const requestSchema = operation.requestBody?.content?.["application/json"]?.schema;
      if (requestSchema !== undefined) {
        const runtimeSchema = runtimeBodySchema(path, method);
        if (runtimeSchema === undefined) throw new Error(`Runtime schema is missing: ${path}`);
        ajv.compile(runtimeSchema);
      }
      for (const [status, response] of Object.entries(operation.responses ?? {})) {
        for (const [mediaType, media] of Object.entries(response.content ?? {})) {
          try { ajv.compile(inlineSchema(media.schema)); }
          catch (error) { throw new Error(`Invalid response schema for ${method.toUpperCase()} ${path} (${status} ${mediaType}): ${String(error)}`); }
        }
      }
    }
  }
  console.log(`OpenAPI contract verified: ${operationIds.size} operations.`);
} finally {
  await app.close();
}
