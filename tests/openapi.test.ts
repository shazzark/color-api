import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import AjvModule from "ajv";
import { OPENAPI_SPEC, type JsonSchema } from "../src/openapi.js";

function resolveSchema(schema: JsonSchema, seen = new Set<string>()): JsonSchema {
  if (schema.$ref !== undefined) {
    const name = schema.$ref.slice("#/components/schemas/".length);
    if (seen.has(name)) throw new Error(`Cyclic test schema reference: ${name}`);
    const target = OPENAPI_SPEC.components.schemas[name];
    if (target === undefined) throw new Error(`Unknown schema reference: ${schema.$ref}`);
    const next = new Set(seen).add(name);
    return resolveSchema(target, next);
  }
  return {
    ...schema,
    ...(schema.properties === undefined ? {} : { properties: Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, resolveSchema(value, seen)])) }),
    ...(schema.items === undefined ? {} : { items: resolveSchema(schema.items, seen) }),
    ...(schema.propertyNames === undefined ? {} : { propertyNames: resolveSchema(schema.propertyNames, seen) }),
    ...(typeof schema.additionalProperties === "object" ? { additionalProperties: resolveSchema(schema.additionalProperties, seen) } : {}),
    ...(schema.oneOf === undefined ? {} : { oneOf: schema.oneOf.map((item) => resolveSchema(item, seen)) }),
    ...(schema.anyOf === undefined ? {} : { anyOf: schema.anyOf.map((item) => resolveSchema(item, seen)) }),
    ...(schema.allOf === undefined ? {} : { allOf: schema.allOf.map((item) => resolveSchema(item, seen)) })
  };
}

describe("OpenAPI contract and runtime route schemas", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });
  afterAll(async () => { await app.close(); });

  it("registers every documented operation and accepts each documented request example", async () => {
    const ajv = new AjvModule.default({ allErrors: true, strict: false });
    for (const [path, methods] of Object.entries(OPENAPI_SPEC.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        const httpMethod = method === "post" ? "POST" : "GET";
        expect(app.hasRoute({ method: httpMethod, url: path }), `${httpMethod} ${path}`).toBe(true);
        const content = operation.requestBody?.content["application/json"];
        const requestValidator = content === undefined ? undefined : ajv.compile(resolveSchema(content.schema));
        const examples = [
          ...(content?.example === undefined ? [] : [content.example]),
          ...Object.values(content?.examples ?? {}).map((item) => item.value)
        ];
        for (const example of examples) {
          if (requestValidator !== undefined) {
            expect(requestValidator(example), `${httpMethod} ${path} request: ${JSON.stringify(requestValidator.errors)}`).toBe(true);
          }
          const response = await app.inject({
            method: httpMethod,
            url: path,
            headers: method === "post" ? { "content-type": "application/json" } : undefined,
            payload: JSON.stringify(example)
          });
          expect(response.statusCode, `${httpMethod} ${path}: ${response.body}`).toBe(200);
          const responseSchema = operation.responses["200"]?.content?.["application/json"]?.schema;
          if (responseSchema !== undefined) {
            const validate = ajv.compile(resolveSchema(responseSchema));
            expect(validate(response.json()), `${httpMethod} ${path} response: ${JSON.stringify(validate.errors)}`).toBe(true);
          }
        }
        for (const [status, responseDefinition] of Object.entries(operation.responses)) {
          for (const [mediaType, responseContent] of Object.entries(responseDefinition.content ?? {})) {
            const validateResponse = ajv.compile(resolveSchema(responseContent.schema));
            const responseExamples = [
              ...(responseContent.example === undefined ? [] : [["default", responseContent.example] as const]),
              ...Object.entries(responseContent.examples ?? {}).map(([name, item]) => [name, item.value] as const)
            ];
            for (const [name, value] of responseExamples) {
              expect(validateResponse(value), `${httpMethod} ${path} ${status} ${mediaType} example ${name}: ${JSON.stringify(validateResponse.errors)}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it("serves the same machine-readable document used for route schemas", async () => {
    const response = await app.inject({ method: "GET", url: "/openapi.json" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(OPENAPI_SPEC);
    const docs = await app.inject({ method: "GET", url: "/docs" });
    expect(docs.statusCode).toBe(200);
    expect(docs.headers["content-type"]).toContain("text/html");
    expect(docs.body).toContain("/openapi.json");
    expect(docs.body).toContain("Try it");
  });

  it("rejects undocumented public GET and POST routes outside the versioned API", async () => {
    const guardedApp = buildApp();
    expect(() => guardedApp.get("/undocumented", async () => ({ status: "ok" }))).toThrow(/missing from the OpenAPI contract/);
    expect(() => guardedApp.post("/undocumented", async () => ({ status: "ok" }))).toThrow(/missing from the OpenAPI contract/);
    await guardedApp.close();
  });

  it("preserves stable route validation errors for malformed requests", async () => {
    const invalidFormat = await app.inject({
      method: "POST", url: "/v1/colors/normalize",
      payload: { color: { format: "hex", value: "not-a-color" } }
    });
    const missingRequired = await app.inject({ method: "POST", url: "/v1/colors/generate", payload: {} });
    expect(invalidFormat.statusCode).toBe(400);
    expect(invalidFormat.json().error.code).toBe("INVALID_COLOR");
    expect(missingRequired.statusCode).toBe(400);
    expect(missingRequired.json().error.code).toBe("INVALID_REQUEST");
  });

  it("documents safe token names in the serializer request schema", () => {
    const schema = OPENAPI_SPEC.paths["/v1/colors/tokens/serialize"]?.post?.requestBody?.content["application/json"].schema;
    if (schema === undefined) throw new Error("Token serializer request schema is missing");
    const validate = new AjvModule.default({ allErrors: true, strict: false }).compile(resolveSchema(schema));
    expect(validate({ tokens: { brand: { format: "hex", value: "#3498db" } }, format: "css" })).toBe(true);
    expect(validate({ tokens: { "bad name": { format: "hex", value: "#3498db" } }, format: "css" })).toBe(false);
  });

  it("keeps palette, scale, and variant response examples tied to their requests", async () => {
    for (const path of ["/v1/colors/palette", "/v1/colors/scales/oklch", "/v1/colors/scales/variants"]) {
      const operation = OPENAPI_SPEC.paths[path]?.post;
      if (operation === undefined) throw new Error(`Missing operation ${path}`);
      const request = operation.requestBody?.content["application/json"].example;
      const documentedResponse = operation.responses["200"]?.content?.["application/json"]?.example;
      if (request === undefined || documentedResponse === undefined) throw new Error(`Missing request or response example for ${path}`);
      const actual = await app.inject({ method: "POST", url: path, headers: { "content-type": "application/json" }, payload: JSON.stringify(request) });
      expect(actual.statusCode, `${path}: ${actual.body}`).toBe(200);
      expect(actual.json()).toEqual(documentedResponse);
    }
  });

  it("rejects unsupported palette counts in both the schema and route", async () => {
    const schema = OPENAPI_SPEC.paths["/v1/colors/palette"]?.post?.requestBody?.content["application/json"].schema;
    if (schema === undefined) throw new Error("Palette request schema is missing");
    const validate = new AjvModule.default({ allErrors: true, strict: false }).compile(resolveSchema(schema));
    const request = { base: { format: "hex", value: "#3498db" }, strategy: "triadic", count: 5 };
    expect(validate(request)).toBe(false);
    const response = await app.inject({ method: "POST", url: "/v1/colors/palette", payload: request });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_REQUEST");
  });
});
