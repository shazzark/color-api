import { convertColor } from "./color/conversion.js";
import { generateHslPalette } from "./color/palette.js";
import { generateOklchScale, generateShades } from "./color/operations.js";
import type { OklchStop } from "./color/operations.js";
import type { ColorValue } from "./color/types.js";

export interface JsonSchema {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: readonly unknown[];
  const?: unknown;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minProperties?: number;
  maxProperties?: number;
  required?: readonly string[];
  additionalProperties?: boolean | JsonSchema;
  properties?: Record<string, JsonSchema>;
  propertyNames?: JsonSchema;
  items?: JsonSchema;
  oneOf?: readonly JsonSchema[];
  anyOf?: readonly JsonSchema[];
  allOf?: readonly JsonSchema[];
  not?: JsonSchema;
  $ref?: string;
}

export interface OpenApiOperation {
  operationId: string;
  summary: string;
  description: string;
  tags: readonly string[];
  requestBody?: {
    required: boolean;
    content: { "application/json": { schema: JsonSchema; example?: unknown; examples?: Record<string, { summary: string; value: unknown }> } };
  };
  responses: Record<string, { description: string; headers?: Record<string, { description: string; schema: JsonSchema }>; content?: Record<string, { schema: JsonSchema; example?: unknown; examples?: Record<string, { summary: string; value: unknown }> }> }>;
}

export interface OpenApiDocument {
  openapi: "3.1.0";
  jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema";
  info: { title: string; version: string; description: string; contact: { name: string } };
  servers: readonly { url: string; description: string }[];
  tags: readonly { name: string; description: string }[];
  paths: Record<string, Partial<Record<"get" | "post", OpenApiOperation>>>;
  components: { schemas: Record<string, JsonSchema> };
  "x-cors-preflight": { route: "OPTIONS /*"; allowedStatus: 204; rejectedStatus: 403; rejectedResponse: JsonSchema; description: string };
}

const format = { type: "string", enum: ["hex", "rgb", "hsl", "hsv", "oklab", "oklch"] } satisfies JsonSchema;
const alpha = { type: "number", minimum: 0, maximum: 1, description: "Optional opacity; omitted means fully opaque." } satisfies JsonSchema;
const numeric = { type: "number" } satisfies JsonSchema;
const bounded = (minimum: number, maximum: number): JsonSchema => ({ type: "number", minimum, maximum });
const structuredValue = (required: string[], properties: Record<string, JsonSchema>): JsonSchema => ({
  type: "object", required, properties: { ...properties, alpha }, additionalProperties: false
});

const colorSchema: JsonSchema = {
  oneOf: [
    { type: "object", required: ["format", "value"], properties: { format: { const: "hex" }, value: { type: "string", pattern: "^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$", description: "Six or eight hexadecimal digits, optionally prefixed by #." } }, additionalProperties: false },
    { type: "object", required: ["format", "value"], properties: { format: { const: "rgb" }, value: structuredValue(["r", "g", "b"], { r: { type: "integer", minimum: 0, maximum: 255 }, g: { type: "integer", minimum: 0, maximum: 255 }, b: { type: "integer", minimum: 0, maximum: 255 } }) }, additionalProperties: false },
    { type: "object", required: ["format", "value"], properties: { format: { const: "hsl" }, value: structuredValue(["h", "s", "l"], { h: numeric, s: bounded(0, 100), l: bounded(0, 100) }) }, additionalProperties: false },
    { type: "object", required: ["format", "value"], properties: { format: { const: "hsv" }, value: structuredValue(["h", "s", "v"], { h: numeric, s: bounded(0, 100), v: bounded(0, 100) }) }, additionalProperties: false },
    { type: "object", required: ["format", "value"], properties: { format: { const: "oklab" }, value: structuredValue(["l", "a", "b"], { l: bounded(0, 1), a: numeric, b: numeric }) }, additionalProperties: false },
    { type: "object", required: ["format", "value"], properties: { format: { const: "oklch" }, value: structuredValue(["l", "c", "h"], { l: bounded(0, 1), c: { type: "number", minimum: 0 }, h: numeric }) }, additionalProperties: false }
  ]
};
const colorRef: JsonSchema = { $ref: "#/components/schemas/ColorValue" };
const object = (required: string[], properties: Record<string, JsonSchema>): JsonSchema => ({
  type: "object", required, properties, additionalProperties: false
});
const openObject = (required: string[], properties: Record<string, JsonSchema>): JsonSchema => ({
  type: "object", required, properties, additionalProperties: true
});
const stringEnum = (...values: string[]): JsonSchema => ({ type: "string", enum: values });
const pair = (minimum: number, maximum: number): JsonSchema => ({ type: "array", minItems: 2, maxItems: 2, items: { type: "number", minimum, maximum } });
const errorRef: JsonSchema = { $ref: "#/components/schemas/ErrorEnvelope" };
const successDescription = "Successful operation.";
const errors: OpenApiOperation["responses"] = {
  "400": {
    description: "Invalid request or color. The code and message are stable; issues and index are present for applicable validation failures.",
    content: {
      "application/json": {
        schema: errorRef,
        example: {
          error: {
            code: "INVALID_COLOR", message: "Invalid RGB color value",
            issues: [{ code: "INVALID_COLOR", path: "/value/r", message: "Invalid RGB color value" }]
          }
        }
      }
    }
  },
  "404": { description: "Unknown route.", content: { "application/json": { schema: errorRef } } },
  "413": { description: "Request body exceeds the configured limit.", content: { "application/json": { schema: errorRef } } },
  "415": { description: "Unsupported request media type.", content: { "application/json": { schema: errorRef } } },
  "429": {
    description: "Anonymous request rate limit exceeded. Includes Retry-After.",
    headers: { "Retry-After": { description: "Seconds until the current rate window resets.", schema: { type: "integer" } } },
    content: { "application/json": { schema: errorRef } }
  },
  "500": { description: "Unexpected server failure; internal details are not exposed.", content: { "application/json": { schema: errorRef } } }
};

function schemaFromExample(value: unknown): JsonSchema {
  if (Array.isArray(value)) return { type: "array", items: value.length === 0 ? {} : schemaFromExample(value[0]) };
  if (value === null) return { type: ["string", "null"] };
  if (typeof value === "object") {
    return {
      type: "object",
      required: Object.keys(value),
      properties: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, schemaFromExample(item)])),
      additionalProperties: false
    };
  }
  if (typeof value === "boolean") return { type: "boolean" };
  if (typeof value === "number") return { type: "number" };
  return { type: "string" };
}

function post(
  operationId: string,
  summary: string,
  description: string,
  schema: JsonSchema,
  example: unknown,
  responseExample?: unknown,
  options: { responseSchema?: JsonSchema; requestExamples?: Record<string, { summary: string; value: unknown }>; responseExamples?: Record<string, { summary: string; value: unknown }> } = {}
): OpenApiOperation {
  return {
    operationId, summary, description, tags: ["Colors"],
    requestBody: { required: true, content: { "application/json": { schema, example, ...(options.requestExamples === undefined ? {} : { examples: options.requestExamples }) } } },
    responses: {
      "200": {
        description: successDescription,
        content: { "application/json": {
          schema: options.responseSchema ?? (responseExample === undefined ? { type: "object", additionalProperties: true } : schemaFromExample(responseExample)),
          ...(responseExample === undefined ? {} : { example: responseExample }),
          ...(options.responseExamples === undefined ? {} : { examples: options.responseExamples })
        } }
      },
      ...errors
    }
  };
}

const color: ColorValue = { format: "hex", value: "#3498db" };
const cssBlockExample = [":root {", "  --color-brand: #3498db;", "}"].join("\n");
const scaleStops: OklchStop[] = [
  { position: 0, color: { format: "oklch", value: { l: 0.4, c: 0.1, h: 250 } } },
  { position: 1, color: { format: "oklch", value: { l: 0.8, c: 0.1, h: 250 } } }
];
const scaleExample = generateOklchScale(scaleStops, 3);
const variantExample = generateShades(color, 5);
const paletteBase: ColorValue = { format: "hex", value: "#3498db" };
const hslPaletteBase = convertColor(paletteBase, "hsl").output;
if (hslPaletteBase.format !== "hsl") throw new Error("Failed to prepare palette example");
const paletteExample = {
  base: paletteBase,
  strategy: "analogous",
  outputFormat: "hex",
  colors: generateHslPalette(hslPaletteBase.value, "analogous", { count: 5 }).map((value) => convertColor({ format: "hsl" as const, value }, "hex").output)
};
const outputFormat = format;
const criterion = stringEnum("wcag-2.2-1.4.3", "wcag-2.2-1.4.11");
const textSize = stringEnum("normal", "large");
const tokenMap: JsonSchema = { type: "object", minProperties: 1, maxProperties: 100, propertyNames: { type: "string", pattern: "^[a-z][a-z0-9-]*$" }, additionalProperties: colorRef };
const paletteResponseSchema = object(["base", "strategy", "outputFormat", "colors"], {
  base: colorRef,
  strategy: stringEnum("complementary", "analogous", "triadic", "tetradic", "split-complementary", "monochromatic"),
  outputFormat: format,
  colors: { type: "array", items: colorRef }
});
const tokenResponseSchema = object(["token", "css"], {
  token: object(["name", "color", "cssVariable", "cssValue"], {
    name: { type: "string", pattern: "^[a-z][a-z0-9-]*$" }, color: colorRef,
    cssVariable: { type: "string", pattern: "^--color-[a-z][a-z0-9-]*$" }, cssValue: { type: "string" }
  }),
  css: { type: "string" }
});
const conversionResultRef: JsonSchema = { $ref: "#/components/schemas/ColorConversionResult" };
const conversionResultSchema: JsonSchema = {
  oneOf: [
    object(["input", "output", "gamutMapped"], { input: colorRef, output: colorRef, gamutMapped: { const: false } }),
    object(["input", "output", "gamutMapped", "gamutMapping"], { input: colorRef, output: colorRef, gamutMapped: { const: true }, gamutMapping: { const: "css-color-4-local-minde" } })
  ]
};
const batchResponseSchema = object(["results"], { results: { type: "array", items: conversionResultRef } });
const scaleResponseSchema: JsonSchema = { type: "array", items: { $ref: "#/components/schemas/PositionedConversionResult" } };
const variantsResponseSchema = object(["kind", "results"], {
  kind: stringEnum("shades", "tints", "tones"),
  results: { type: "array", items: conversionResultRef }
});
const serializedTokenResponseSchema: JsonSchema = {
  oneOf: ["css", "scss", "json", "javascript", "typescript", "tailwind"].map((name) => object(["format", "content"], {
    format: { const: name }, content: { type: "string" }
  })).concat([
    object(["format", "content"], { format: { const: "object" }, content: { type: "object" } }),
    object(["format", "content"], { format: { const: "document" }, content: { type: "object" } })
  ])
};
const generateResponseSchema: JsonSchema = { oneOf: [
  object(["algorithm", "seed", "colors"], { algorithm: { const: "mulberry32-v1" }, seed: { oneOf: [{ type: "string" }, { type: "integer" }] }, colors: { type: "array", items: colorRef } }),
  object(["algorithm", "colors"], { algorithm: { const: "Math.random" }, colors: { type: "array", items: colorRef } })
] };
const contrastResponseSchema = object(["contrastRatio", "rawContrastRatio", "criterion", "threshold", "passesCriterion", "compositing", "foreground", "background", "effectiveForeground", "effectiveBackground", "effectiveSrgb"], {
  contrastRatio: numeric, rawContrastRatio: numeric,
  wcag: object(["normalText", "largeText"], {
    normalText: object(["aa", "aaa"], { aa: { type: "boolean" }, aaa: { type: "boolean" } }),
    largeText: object(["aa", "aaa"], { aa: { type: "boolean" }, aaa: { type: "boolean" } })
  }), criterion, threshold: numeric, passesCriterion: { type: "boolean" },
  textSize, context: { type: "string" }, compositing: { const: "css-srgb-source-over" }, foreground: colorRef, background: colorRef,
  effectiveForeground: colorRef, effectiveBackground: colorRef,
  effectiveSrgb: object(["foreground", "background"], { foreground: object(["r", "g", "b"], { r: numeric, g: numeric, b: numeric }), background: object(["r", "g", "b"], { r: numeric, g: numeric, b: numeric }) }),
  canvas: colorRef
});
const analyzeResponseSchema: JsonSchema = {
  type: "object", required: ["color", "relativeLuminance", "isLight", "isDark"],
  properties: { color: colorRef, relativeLuminance: numeric, isLight: { type: "boolean" }, isDark: { type: "boolean" }, hue: numeric, saturation: numeric, chroma: numeric }, additionalProperties: false
};
const suggestionsResponseSchema = object(["candidates", "criterion", "threshold", "background", "iterationsPerDirection"], {
  candidates: { type: "array", items: object(["direction", "color", "contrastRatio", "deltaEOK", "gamutMapped"], {
    direction: stringEnum("lighter", "darker"), color: colorRef, contrastRatio: numeric, deltaEOK: numeric,
    gamutMapped: { type: "boolean" }, gamutMapping: { const: "css-color-4-local-minde" }
  }) }, criterion, threshold: numeric, context: { type: "string" }, textSize,
  background: colorRef, canvas: colorRef, iterationsPerDirection: { type: "integer", const: 24 }
});
const validationResponseSchema: JsonSchema = { oneOf: [
  object(["valid", "color"], { valid: { const: true }, color: colorRef }),
  object(["valid", "errors"], { valid: { const: false }, errors: { type: "array", items: object(["code", "path", "message"], { code: { type: "string" }, path: { type: "string" }, message: { type: "string" }, index: { type: "integer", minimum: 0 } }) } })
] };
const manipulationRequestSchema: JsonSchema = { oneOf: [
  object(["operation", "color", "amount"], { operation: stringEnum("rotateHue", "adjustLightness", "adjustChroma", "adjustSaturation"), color: colorRef, amount: numeric }),
  object(["operation", "color", "alpha"], { operation: { const: "adjustAlpha" }, color: colorRef, alpha }),
  object(["operation", "color"], { operation: stringEnum("grayscale", "invert"), color: colorRef })
] };
const conversionRequestSchema: JsonSchema = {
  oneOf: (colorSchema.oneOf ?? []).map((variant) => {
    const properties = variant.properties;
    if (properties?.format === undefined || properties.value === undefined) throw new Error("Color schema variant is missing format/value fields");
    return openObject(["from", "to", "value"], { from: properties.format, to: format, value: properties.value });
  })
};
const contrastRequestSchema: JsonSchema = { oneOf: [
  { ...openObject(["foreground", "background"], { foreground: colorRef, background: colorRef, textSize, context: { type: "string", minLength: 1 }, canvas: colorRef }), not: { required: ["criterion"] } },
  openObject(["foreground", "background", "criterion"], { foreground: colorRef, background: colorRef, criterion: { const: "wcag-2.2-1.4.3" }, textSize, context: { type: "string", minLength: 1 }, canvas: colorRef }),
  { ...openObject(["foreground", "background", "criterion", "context"], { foreground: colorRef, background: colorRef, criterion: { const: "wcag-2.2-1.4.11" }, context: { type: "string", minLength: 1 }, canvas: colorRef }), not: { required: ["textSize"] } }
] };
const suggestionsRequestSchema: JsonSchema = { oneOf: [
  { ...openObject(["foreground", "background"], { foreground: colorRef, background: colorRef, threshold: { type: "number", enum: [4.5, 7] }, context: { type: "string", minLength: 1 }, canvas: colorRef }), not: { anyOf: [{ required: ["criterion"] }, { required: ["textSize"] }] } },
  { ...openObject(["foreground", "background", "criterion"], { foreground: colorRef, background: colorRef, criterion: { const: "wcag-2.2-1.4.3" }, threshold: { type: "number", enum: [4.5, 7] }, context: { type: "string", minLength: 1 }, canvas: colorRef }), not: { required: ["textSize"] } },
  { ...openObject(["foreground", "background", "textSize"], { foreground: colorRef, background: colorRef, textSize: { const: "normal" }, threshold: { type: "number", enum: [4.5, 7] }, context: { type: "string", minLength: 1 }, canvas: colorRef }), not: { required: ["criterion"] } },
  { ...openObject(["foreground", "background", "textSize"], { foreground: colorRef, background: colorRef, textSize: { const: "large" }, threshold: { type: "number", enum: [3, 4.5] }, context: { type: "string", minLength: 1 }, canvas: colorRef }), not: { required: ["criterion"] } },
  openObject(["foreground", "background", "criterion", "textSize"], { foreground: colorRef, background: colorRef, criterion: { const: "wcag-2.2-1.4.3" }, textSize: { const: "normal" }, threshold: { type: "number", enum: [4.5, 7] }, context: { type: "string", minLength: 1 }, canvas: colorRef }),
  openObject(["foreground", "background", "criterion", "textSize"], { foreground: colorRef, background: colorRef, criterion: { const: "wcag-2.2-1.4.3" }, textSize: { const: "large" }, threshold: { type: "number", enum: [3, 4.5] }, context: { type: "string", minLength: 1 }, canvas: colorRef }),
  object(["foreground", "background", "criterion", "context"], { foreground: colorRef, background: colorRef, criterion: { const: "wcag-2.2-1.4.11" }, context: { type: "string", minLength: 1 }, threshold: { const: 3 }, canvas: colorRef })
] };

export const OPENAPI_SPEC: OpenApiDocument = {
  openapi: "3.1.0",
  jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
  info: {
    title: "Color API",
    version: "1.0.0",
    description: "Versioned, anonymous API for deterministic color operations. The API is not yet publicly released; `/v1` request or response shapes may evolve before the first release. After public release, backward-incompatible changes use a new major API path; deprecated operations receive a documented migration period. JSON bodies default to 65,536 bytes and can be configured from 1,024 to 1,048,576 bytes. The in-process rate limit defaults to 120 requests per socket IP per 60 seconds; health and OPTIONS requests are excluded. Forwarded client-IP headers are ignored unless RATE_LIMIT_CLIENT_IP_HEADER explicitly selects one; only use that setting when trusted infrastructure overwrites the header and untrusted callers cannot reach the service. CORS allows only configured exact HTTP(S) origins and does not enable credentials.",
    contact: { name: "Color API maintainers" }
  },
  "x-cors-preflight": { route: "OPTIONS /*", allowedStatus: 204, rejectedStatus: 403, rejectedResponse: errorRef, description: "An allowed or origin-free preflight returns 204. An origin outside the configured exact-origin allowlist returns 403 with CORS_ORIGIN_DENIED." },
  servers: [{ url: "/", description: "Current server origin" }],
  tags: [{ name: "Colors", description: "Stateless color operations." }, { name: "Service", description: "Service health and API documentation." }],
  paths: {
    "/health": {
      get: {
        operationId: "getHealth", summary: "Check liveness",
        description: "Returns liveness only; no dependency-based readiness check is needed for this stateless service.", tags: ["Service"],
        responses: { "200": { description: "Service process is responding.", content: { "application/json": { schema: object(["status"], { status: { const: "ok" } }), example: { status: "ok" } } } } }
      }
    },
    "/openapi.json": {
      get: {
        operationId: "getOpenApi", summary: "Get the OpenAPI contract",
        description: "Returns this OpenAPI 3.1 document.", tags: ["Service"],
        responses: {
          "200": { description: "OpenAPI document.", content: { "application/json": { schema: {
            type: "object", required: ["openapi", "info", "paths", "components"],
            properties: { openapi: { const: "3.1.0" }, info: { type: "object" }, paths: { type: "object" }, components: { type: "object" } }
          } } } }
        }
      }
    },
    "/docs": {
      get: {
        operationId: "getDocs", summary: "Open interactive API reference",
        description: "Serves a lightweight API explorer generated from this OpenAPI document.", tags: ["Service"],
        responses: {
          "200": { description: "Interactive API reference HTML.", content: { "text/html": { schema: { type: "string" } } } }
        }
      }
    },
    "/v1/colors/convert": { post: post("convertColor", "Convert or normalize a color", "Converts between the six supported formats. `value` must match `from`. Same-format conversion performs canonical normalization. sRGB-bounded outputs use CSS Color 4 local-MINDE when required.", conversionRequestSchema, { from: "hex", to: "rgb", value: "#3498db" }, { input: color, output: { format: "rgb", value: { r: 52, g: 152, b: 219 } }, gamutMapped: false }, { responseSchema: conversionResultRef, responseExamples: { inGamut: { summary: "In-gamut conversion", value: { input: color, output: { format: "rgb", value: { r: 52, g: 152, b: 219 } }, gamutMapped: false } }, gamutMapped: { summary: "Out-of-gamut OKLCH mapped to sRGB", value: { input: { format: "oklch", value: { l: 0.7, c: 0.4, h: 30 } }, output: { format: "rgb", value: { r: 255, g: 111, b: 91 } }, gamutMapped: true, gamutMapping: "css-color-4-local-minde" } } } }) },
    "/v1/colors/batch/convert": { post: post("batchConvertColors", "Convert a batch", "Converts 1–100 mixed-format colors atomically and preserves order. One output format applies to all entries; invalid color errors include a zero-based index.", openObject(["colors"], { colors: { type: "array", minItems: 1, maxItems: 100, items: colorRef }, outputFormat }), { colors: [color, { format: "rgb", value: { r: 231, g: 76, b: 60 } }], outputFormat: "hsl" }, { results: [{ input: color, output: { format: "hsl", value: { h: 204.07, s: 69.87, l: 53.14 } }, gamutMapped: false }, { input: { format: "rgb", value: { r: 231, g: 76, b: 60 } }, output: { format: "hsl", value: { h: 6, s: 78.69, l: 57.25 } }, gamutMapped: false }] }, { responseSchema: batchResponseSchema }) },
    "/v1/colors/contrast": { post: post("analyzeContrast", "Evaluate contrast", "Evaluates one foreground/background pair against WCAG 2.2. Transparent colors require enough opaque canvas context. Non-text checks use SC 1.4.11 and require a named context; textSize is invalid for non-text checks.", contrastRequestSchema, { foreground: { format: "hex", value: "#ffffff" }, background: { format: "hex", value: "#000000" }, criterion: "wcag-2.2-1.4.3", textSize: "normal" }, { contrastRatio: 21, rawContrastRatio: 21, wcag: { normalText: { aa: true, aaa: true }, largeText: { aa: true, aaa: true } }, criterion: "wcag-2.2-1.4.3", threshold: 4.5, passesCriterion: true, textSize: "normal", compositing: "css-srgb-source-over", foreground: { format: "hex", value: "#ffffff" }, background: { format: "hex", value: "#000000" }, effectiveForeground: { format: "rgb", value: { r: 255, g: 255, b: 255 } }, effectiveBackground: { format: "rgb", value: { r: 0, g: 0, b: 0 } }, effectiveSrgb: { foreground: { r: 1, g: 1, b: 1 }, background: { r: 0, g: 0, b: 0 } } }, { responseSchema: contrastResponseSchema, requestExamples: { transparentText: { summary: "Transparent foreground with explicit canvas", value: { foreground: { format: "hex", value: "#ffffff80" }, background: { format: "hex", value: "#000000" }, canvas: { format: "hex", value: "#ffffff" }, criterion: "wcag-2.2-1.4.3", textSize: "normal" } }, nonTextBoundary: { summary: "Named WCAG non-text boundary", value: { foreground: { format: "hex", value: "#000000" }, background: { format: "hex", value: "#ffffff" }, criterion: "wcag-2.2-1.4.11", context: "icon boundary" } } } }) },
    "/v1/colors/palette": { post: post("generatePalette", "Generate a harmony palette", "Creates complementary, analogous, triadic, tetradic, split-complementary, or monochromatic colors. Analogous count is 2–12; other strategies have fixed sizes.", { oneOf: [openObject(["base", "strategy"], { base: colorRef, strategy: { const: "analogous" }, count: { type: "integer", minimum: 2, maximum: 12 }, outputFormat }), { ...openObject(["base", "strategy"], { base: colorRef, strategy: stringEnum("complementary", "triadic", "tetradic", "split-complementary", "monochromatic"), outputFormat }), not: { required: ["count"] } }] }, { base: color, strategy: "analogous", count: 5, outputFormat: "hex" }, paletteExample, { responseSchema: paletteResponseSchema, requestExamples: { structuredOutput: { summary: "Structured OKLCH palette", value: { base: { format: "rgb", value: { r: 52, g: 152, b: 219 } }, strategy: "analogous", count: 5, outputFormat: "oklch" } } } }) },
    "/v1/colors/tokens": { post: post("createColorToken", "Create a single color token", "Creates a validated CSS custom-property token. Names match ^[a-z][a-z0-9-]*$.", openObject(["name", "color"], { name: { type: "string", pattern: "^[a-z][a-z0-9-]*$" }, color: colorRef, outputFormat }), { name: "brand", color, outputFormat: "hex" }, { token: { name: "brand", color, cssVariable: "--color-brand", cssValue: "#3498db" }, css: cssBlockExample }, { responseSchema: tokenResponseSchema, requestExamples: { structuredOutput: { summary: "Structured RGB token", value: { name: "brand", color: { format: "hex", value: "#3498db" }, outputFormat: "rgb" } } } }) },
    "/v1/colors/validate": { post: post("validateColor", "Validate a color", "Accepts any color value and returns a non-throwing validity result with structured JSON Pointer issues.", openObject(["color"], { color: {} }), { color }, { valid: true, color }, { responseSchema: validationResponseSchema, requestExamples: { invalid: { summary: "Invalid color reports validation issues", value: { color: { format: "rgb", value: { r: 300, g: 0, b: 0 } } } } } }) },
    "/v1/colors/normalize": { post: post("normalizeColor", "Normalize a color", "Validates and returns canonical normalized color data.", object(["color"], { color: colorRef }), { color: { format: "hex", value: "#AABBCC" } }, { format: "hex", value: "#aabbcc" }, { responseSchema: colorRef, requestExamples: { structured: { summary: "Normalize structured OKLCH", value: { color: { format: "oklch", value: { l: 0.62, c: 0.14, h: 250 } } } } } }) },
    "/v1/colors/generate": { post: post("generateColors", "Generate colors", "Generates 1–100 deterministic or nondeterministic OKLCH colors. REST count is capped at 100 and string seeds at 128 characters. Seeded output identifies mulberry32-v1; unseeded output identifies Math.random.", object(["count"], { count: { type: "integer", minimum: 1, maximum: 100 }, seed: { oneOf: [{ type: "string", maxLength: 128 }, { type: "integer", minimum: -9007199254740991, maximum: 9007199254740991 }] }, constraints: object([], { lightness: pair(0, 1), chroma: pair(0, 0.4), hue: pair(0, 360) }) }), { count: 3, seed: "brand-system" }, { algorithm: "mulberry32-v1", seed: "brand-system", colors: [{ format: "oklch", value: { l: 0.6, c: 0.1, h: 120 } }] }, { responseSchema: generateResponseSchema, requestExamples: { unseeded: { summary: "Non-reproducible generation", value: { count: 3 } } }, responseExamples: { seeded: { summary: "Reproducible seeded result", value: { algorithm: "mulberry32-v1", seed: "brand-system", colors: [{ format: "oklch", value: { l: 0.6, c: 0.1, h: 120 } }] } }, unseeded: { summary: "Unseeded result", value: { algorithm: "Math.random", colors: [{ format: "oklch", value: { l: 0.5, c: 0.12, h: 180 } }] } } } }) },
    "/v1/colors/manipulate": { post: post("manipulateColor", "Manipulate a color", "Applies one named operation: rotateHue, adjustLightness, adjustChroma, adjustSaturation, adjustAlpha, grayscale, or invert. Amount ranges are validated by the operation.", manipulationRequestSchema, { operation: "adjustLightness", color, amount: 0.1 }, { operation: "adjustLightness", output: color }, { responseSchema: object(["operation", "output"], { operation: stringEnum("rotateHue", "adjustLightness", "adjustChroma", "adjustSaturation", "adjustAlpha", "grayscale", "invert"), output: colorRef }) }) },
    "/v1/colors/mix": { post: post("mixColors", "Interpolate two colors", "Mixes in premultiplied OKLab or encoded sRGB. Weight is in [0,1]. This is interpolation, distinct from source-over compositing.", object(["first", "second"], { first: colorRef, second: colorRef, weight: bounded(0, 1), space: stringEnum("oklab", "srgb") }), { first: color, second: { format: "hex", value: "#e74c3c" }, weight: 0.5, space: "oklab" }, { output: color }, { responseSchema: object(["output"], { output: colorRef }) }) },
    "/v1/colors/composite": { post: post("compositeColors", "Composite colors", "Composites foreground over background with css-srgb-source-over; a translucent background requires an opaque canvas.", object(["foreground", "background"], { foreground: colorRef, background: colorRef, canvas: colorRef }), { foreground: { format: "hex", value: "#ff000080" }, background: { format: "hex", value: "#ffffff" } }, { output: { format: "rgb", value: { r: 255, g: 127, b: 127 } } }, { responseSchema: object(["output"], { output: colorRef }) }) },
    "/v1/colors/scales/oklch": { post: post("generateOklchScale", "Generate an OKLCH scale", "Samples 2–10 ordered stops at 2–101 evenly spaced positions. Stops must span 0 to 1 with strictly increasing positions, non-decreasing lightness, and equal alpha across stops.", object(["stops", "count"], { stops: { type: "array", minItems: 2, maxItems: 10, items: object(["position", "color"], { position: bounded(0, 1), color: colorRef }) }, count: { type: "integer", minimum: 2, maximum: 101 }, outputFormat }), { stops: [{ position: 0, color: { format: "oklch", value: { l: 0.4, c: 0.1, h: 250 } } }, { position: 1, color: { format: "oklch", value: { l: 0.8, c: 0.1, h: 250 } } }], count: 3 }, scaleExample, { responseSchema: scaleResponseSchema }) },
    "/v1/colors/scales/variants": { post: post("generateColorVariants", "Generate shades, tints, or tones", "Returns 2–101 ordered variants. Count defaults to 5.", object(["color", "kind"], { color: colorRef, kind: stringEnum("shades", "tints", "tones"), count: { type: "integer", minimum: 2, maximum: 101 }, outputFormat }), { color, kind: "shades", count: 5 }, { kind: "shades", results: variantExample }, { responseSchema: variantsResponseSchema }) },
    "/v1/colors/analyze": { post: post("analyzeColor", "Analyze a color", "Returns relative luminance, light/dark heuristic, hue, saturation/chroma where defined, and normalized color data.", object(["color"], { color: colorRef }), { color }, { color, isLight: false, isDark: true, relativeLuminance: 0.28 }, { responseSchema: analyzeResponseSchema }) },
    "/v1/colors/distance": { post: post("measureColorDistance", "Measure color distance", "Returns deltaEOK, Euclidean distance in OKLab; no universal similarity threshold is implied.", object(["first", "second"], { first: colorRef, second: colorRef }), { first: color, second: { format: "hex", value: "#e74c3c" } }, { metric: "deltaEOK", distance: 0.2 }) },
    "/v1/colors/contrast/suggestions": { post: post("suggestContrastingColors", "Suggest foreground colors", "Searches deterministic OKLCH lightness directions and verifies mapped/composited candidates against the requested WCAG criterion and context. Non-text suggestions require context and forbid textSize. Allowed thresholds are 4.5 or 7 for normal text, 3 or 4.5 for large text, and 3 for non-text.", suggestionsRequestSchema, { foreground: { format: "hex", value: "#777777" }, background: { format: "hex", value: "#ffffff" }, criterion: "wcag-2.2-1.4.3", textSize: "normal" }, { criterion: "wcag-2.2-1.4.3", threshold: 4.5, candidates: [], background: { format: "hex", value: "#ffffff" }, iterationsPerDirection: 24 }, { responseSchema: suggestionsResponseSchema }) },
    "/v1/colors/tokens/serialize": { post: post("serializeDesignTokens", "Serialize multiple color tokens", "Serializes 1–100 ordered safe token names as CSS, SCSS, JSON, JavaScript, TypeScript, Tailwind data, objects, or design-token documents.", object(["tokens", "format"], { tokens: tokenMap, format: stringEnum("css", "scss", "json", "javascript", "typescript", "tailwind", "object", "document") }), { tokens: { brand: color }, format: "css" }, { format: "css", content: cssBlockExample }, { responseSchema: serializedTokenResponseSchema }) }
  },
  components: {
    schemas: {
      ColorValue: colorSchema,
      ColorConversionResult: conversionResultSchema,
      PositionedConversionResult: object(["input", "output", "gamutMapped", "position"], { input: colorRef, output: colorRef, gamutMapped: { type: "boolean" }, gamutMapping: { const: "css-color-4-local-minde" }, position: bounded(0, 1) }),
      ErrorEnvelope: object(["error"], {
        error: object(["code", "message"], {
          code: { type: "string", enum: ["INVALID_REQUEST", "INVALID_COLOR", "UNSUPPORTED_CONVERSION", "NOT_FOUND", "PAYLOAD_TOO_LARGE", "UNSUPPORTED_MEDIA_TYPE", "RATE_LIMITED", "CORS_ORIGIN_DENIED", "INTERNAL_ERROR"] },
          message: { type: "string" },
          index: { type: "integer", minimum: 0 },
          issues: {
            type: "array",
            items: object(["code", "path", "message"], {
              code: { type: "string" },
              path: { type: "string" },
              message: { type: "string" },
              index: { type: "integer", minimum: 0 }
            })
          }
        })
      })
    }
  }
};

function resolveSchema(schema: JsonSchema, seen = new Set<string>()): JsonSchema {
  if (schema.$ref !== undefined) {
    const name = schema.$ref.slice("#/components/schemas/".length);
    if (!schema.$ref.startsWith("#/components/schemas/") || seen.has(name)) throw new Error(`Unsupported OpenAPI schema reference: ${schema.$ref}`);
    const referenced = OPENAPI_SPEC.components.schemas[name];
    if (referenced === undefined) throw new Error(`Unknown OpenAPI schema reference: ${schema.$ref}`);
    const nextSeen = new Set(seen);
    nextSeen.add(name);
    return resolveSchema(referenced, nextSeen);
  }
  return {
    ...schema,
    ...(schema.properties === undefined ? {} : { properties: Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, resolveSchema(value, seen)])) }),
    ...(typeof schema.additionalProperties === "object" ? { additionalProperties: resolveSchema(schema.additionalProperties, seen) } : {}),
    ...(schema.items === undefined ? {} : { items: resolveSchema(schema.items, seen) }),
    ...(schema.oneOf === undefined ? {} : { oneOf: schema.oneOf.map((item) => resolveSchema(item, seen)) }),
    ...(schema.anyOf === undefined ? {} : { anyOf: schema.anyOf.map((item) => resolveSchema(item, seen)) }),
    ...(schema.allOf === undefined ? {} : { allOf: schema.allOf.map((item) => resolveSchema(item, seen)) })
  };
}

export function runtimeBodySchema(path: string, method: "get" | "post"): JsonSchema | undefined {
  const operation = OPENAPI_SPEC.paths[path]?.[method];
  const schema = operation?.requestBody?.content["application/json"].schema;
  return schema === undefined ? undefined : resolveSchema(schema);
}
