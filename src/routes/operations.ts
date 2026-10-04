import type { FastifyInstance } from "fastify";
import {
  adjustAlpha, adjustChroma, adjustLightness, adjustSaturation, generateColors,
  generateOklchScale, generateShades, generateTints, generateTones, grayscaleColor,
  invertColor, mixColors, rotateHue, type OklchConstraints, type OklchStop
} from "../color/operations.js";
import { analyzeColor, compositeColors, deltaEOK, suggestContrastingColors } from "../color/contrast.js";
import {
  createColorObject, createCssVariablesBlock, createDesignTokenDocument,
  createTailwindColorData, serializeDesignTokens, serializeJavaScriptObject,
  serializeScssVariables, serializeTypeScriptObject
} from "../color/tokens.js";
import type { ColorFormat, ColorValue } from "../color/types.js";
import {
  InvalidRequestError, isColorFormat, normalizeColor, validateColor,
  validateColorValue, validateTokenName
} from "../color/validation.js";

const MAX_GENERATION_COUNT = 100;
const MAX_SERIALIZED_TOKENS = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bodyRecord(body: unknown, message: string): Record<string, unknown> {
  if (!isRecord(body)) throw new InvalidRequestError(message);
  return body;
}

function onlyKeys(value: Record<string, unknown>, keys: readonly string[], message = "Request contains unsupported fields"): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) throw new InvalidRequestError(message);
}

function parseColor(value: unknown): ColorValue {
  if (!isRecord(value) || typeof value.format !== "string" || !isColorFormat(value.format)
    || !("value" in value) || Object.keys(value).some((key) => key !== "format" && key !== "value")) {
    throw new InvalidRequestError("Color must contain a supported format and value");
  }
  return validateColorValue(value.format, value.value);
}

function outputFormat(value: unknown): ColorFormat {
  if (typeof value !== "string" || !isColorFormat(value)) throw new InvalidRequestError("Invalid output format");
  return value;
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new InvalidRequestError(`${label} must be a finite number`);
  return value;
}

function integerRange(value: unknown, label: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new InvalidRequestError(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function parseRange(value: unknown, label: string): readonly [number, number] {
  if (!Array.isArray(value) || value.length !== 2
    || typeof value[0] !== "number" || !Number.isFinite(value[0])
    || typeof value[1] !== "number" || !Number.isFinite(value[1])) {
    throw new InvalidRequestError(`${label} must be a pair of finite numbers`);
  }
  return [value[0], value[1]];
}

function parseConstraints(value: unknown): OklchConstraints | undefined {
  if (value === undefined) return undefined;
  const input = bodyRecord(value, "constraints must be an object");
  onlyKeys(input, ["lightness", "chroma", "hue"], "Unsupported generation constraint");
  return {
    ...(input.lightness === undefined ? {} : { lightness: parseRange(input.lightness, "lightness") }),
    ...(input.chroma === undefined ? {} : { chroma: parseRange(input.chroma, "chroma") }),
    ...(input.hue === undefined ? {} : { hue: parseRange(input.hue, "hue") })
  };
}

function validateSeed(value: unknown): number | string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string" && value.length <= 128) return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  throw new InvalidRequestError("seed must be a string of at most 128 characters or a safe integer");
}

export async function operationRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/colors/validate", async (request) => {
    const body = bodyRecord(request.body, "Request must contain a color field");
    onlyKeys(body, ["color"]);
    if (!("color" in body)) throw new InvalidRequestError("Request must contain a color field");
    return validateColor(body.color);
  });

  app.post("/v1/colors/normalize", async (request) => {
    const body = bodyRecord(request.body, "Request must contain a color field");
    onlyKeys(body, ["color"]);
    if (!("color" in body)) throw new InvalidRequestError("Request must contain a color field");
    return normalizeColor(body.color);
  });

  app.post("/v1/colors/generate", async (request) => {
    const body = bodyRecord(request.body, "Request must contain a count");
    onlyKeys(body, ["count", "seed", "constraints"]);
    const count = integerRange(body.count, "count", 1, MAX_GENERATION_COUNT);
    const seed = validateSeed(body.seed);
    const constraints = parseConstraints(body.constraints);
    return generateColors(count, { ...(seed === undefined ? {} : { seed }), ...(constraints === undefined ? {} : { constraints }) });
  });

  app.post("/v1/colors/manipulate", async (request) => {
    const body = bodyRecord(request.body, "Request must contain operation and color");
    if (typeof body.operation !== "string" || !("color" in body)) {
      throw new InvalidRequestError("Request must contain operation and color");
    }
    const color = parseColor(body.color);
    let output: ColorValue;
    switch (body.operation) {
      case "rotateHue":
      case "adjustLightness":
      case "adjustChroma":
      case "adjustSaturation": {
        onlyKeys(body, ["operation", "color", "amount"]);
        const amount = finiteNumber(body.amount, "amount");
        output = body.operation === "rotateHue" ? rotateHue(color, amount)
          : body.operation === "adjustLightness" ? adjustLightness(color, amount)
            : body.operation === "adjustChroma" ? adjustChroma(color, amount)
              : adjustSaturation(color, amount);
        break;
      }
      case "adjustAlpha":
        onlyKeys(body, ["operation", "color", "alpha"]);
        output = adjustAlpha(color, finiteNumber(body.alpha, "alpha"));
        break;
      case "grayscale":
        onlyKeys(body, ["operation", "color"]);
        output = grayscaleColor(color);
        break;
      case "invert":
        onlyKeys(body, ["operation", "color"]);
        output = invertColor(color);
        break;
      default:
        throw new InvalidRequestError("Unsupported color manipulation operation");
    }
    return { operation: body.operation, output };
  });

  app.post("/v1/colors/mix", async (request) => {
    const body = bodyRecord(request.body, "Request must contain first and second colors");
    onlyKeys(body, ["first", "second", "weight", "space"]);
    if (!("first" in body) || !("second" in body)) throw new InvalidRequestError("Request must contain first and second colors");
    const weight = body.weight === undefined ? 0.5 : finiteNumber(body.weight, "weight");
    const space = body.space === undefined ? "oklab" : body.space;
    if (space !== "oklab" && space !== "srgb") throw new InvalidRequestError("space must be oklab or srgb");
    return { output: mixColors(parseColor(body.first), parseColor(body.second), weight, space) };
  });

  app.post("/v1/colors/composite", async (request) => {
    const body = bodyRecord(request.body, "Request must contain foreground and background colors");
    onlyKeys(body, ["foreground", "background", "canvas"]);
    if (!("foreground" in body) || !("background" in body)) {
      throw new InvalidRequestError("Request must contain foreground and background colors");
    }
    const foreground = parseColor(body.foreground);
    const background = parseColor(body.background);
    const canvas = body.canvas === undefined ? undefined : parseColor(body.canvas);
    return { output: compositeColors(foreground, background, canvas) };
  });

  app.post("/v1/colors/scales/oklch", async (request) => {
    const body = bodyRecord(request.body, "Request must contain stops and count");
    onlyKeys(body, ["stops", "count", "outputFormat"]);
    if (!Array.isArray(body.stops) || body.stops.length < 2 || body.stops.length > 10) {
      throw new InvalidRequestError("stops must contain between 2 and 10 items");
    }
    const count = integerRange(body.count, "count", 2, 101);
    const format = body.outputFormat === undefined ? "hex" : outputFormat(body.outputFormat);
    const stops: OklchStop[] = body.stops.map((item) => {
      const stop = bodyRecord(item, "Each stop must contain position and color");
      onlyKeys(stop, ["position", "color"]);
      if (!("position" in stop) || !("color" in stop)) throw new InvalidRequestError("Each stop must contain position and color");
      return { position: finiteNumber(stop.position, "stop position"), color: parseColor(stop.color) };
    });
    return generateOklchScale(stops, count, format);
  });

  app.post("/v1/colors/scales/variants", async (request) => {
    const body = bodyRecord(request.body, "Request must contain color and kind");
    onlyKeys(body, ["color", "kind", "count", "outputFormat"]);
    if (!("color" in body) || (body.kind !== "shades" && body.kind !== "tints" && body.kind !== "tones")) {
      throw new InvalidRequestError("Request must contain color and kind (shades, tints, or tones)");
    }
    const count = integerRange(body.count === undefined ? 5 : body.count, "count", 2, 101);
    const format = body.outputFormat === undefined ? "hex" : outputFormat(body.outputFormat);
    const color = parseColor(body.color);
    const results = body.kind === "shades" ? generateShades(color, count, format)
      : body.kind === "tints" ? generateTints(color, count, format)
        : generateTones(color, count, format);
    return { kind: body.kind, results };
  });

  app.post("/v1/colors/analyze", async (request) => {
    const body = bodyRecord(request.body, "Request must contain a color field");
    onlyKeys(body, ["color"]);
    if (!("color" in body)) throw new InvalidRequestError("Request must contain a color field");
    return analyzeColor(parseColor(body.color));
  });

  app.post("/v1/colors/distance", async (request) => {
    const body = bodyRecord(request.body, "Request must contain first and second colors");
    onlyKeys(body, ["first", "second"]);
    if (!("first" in body) || !("second" in body)) throw new InvalidRequestError("Request must contain first and second colors");
    return { metric: "deltaEOK", distance: deltaEOK(parseColor(body.first), parseColor(body.second)) };
  });

  app.post("/v1/colors/contrast/suggestions", async (request) => {
    const body = bodyRecord(request.body, "Request must contain foreground and background colors");
    onlyKeys(body, ["foreground", "background", "criterion", "textSize", "context", "canvas", "threshold"]);
    if (!("foreground" in body) || !("background" in body)) {
      throw new InvalidRequestError("Request must contain foreground and background colors");
    }
    const criterion = body.criterion === undefined ? "wcag-2.2-1.4.3" : body.criterion;
    const textSize = body.textSize === undefined ? "normal" : body.textSize;
    if (criterion !== "wcag-2.2-1.4.3" && criterion !== "wcag-2.2-1.4.11") {
      throw new InvalidRequestError("Unsupported contrast criterion");
    }
    if (textSize !== "normal" && textSize !== "large") throw new InvalidRequestError("textSize must be normal or large");
    if (criterion === "wcag-2.2-1.4.11" && body.textSize !== undefined) {
      throw new InvalidRequestError("textSize does not apply to non-text contrast");
    }
    if (body.context !== undefined && (typeof body.context !== "string" || body.context.trim() === "")) {
      throw new InvalidRequestError("context must be a non-empty string");
    }
    const threshold = body.threshold === undefined ? undefined : finiteNumber(body.threshold, "threshold");
    const canvas = body.canvas === undefined ? undefined : parseColor(body.canvas);
    return suggestContrastingColors(parseColor(body.foreground), parseColor(body.background), {
      criterion,
      ...(criterion === "wcag-2.2-1.4.3" ? { textSize } : {}),
      ...(typeof body.context === "string" ? { context: body.context } : {}),
      ...(canvas === undefined ? {} : { canvas }),
      ...(threshold === undefined ? {} : { threshold })
    });
  });

  app.post("/v1/colors/tokens/serialize", async (request) => {
    const body = bodyRecord(request.body, "Request must contain tokens and format");
    onlyKeys(body, ["tokens", "format"]);
    if (!isRecord(body.tokens) || Array.isArray(body.tokens)) throw new InvalidRequestError("tokens must be an object");
    const entries = Object.entries(body.tokens);
    if (entries.length < 1 || entries.length > MAX_SERIALIZED_TOKENS) {
      throw new InvalidRequestError(`tokens must contain between 1 and ${MAX_SERIALIZED_TOKENS} items`);
    }
    const tokens: Record<string, ColorValue> = {};
    for (const [name, color] of entries) {
      validateTokenName(name);
      tokens[name] = parseColor(color);
    }
    const format = body.format;
    if (format === "css") return { format, content: createCssVariablesBlock(tokens) };
    if (format === "scss") return { format, content: serializeScssVariables(tokens) };
    if (format === "json") return { format, content: serializeDesignTokens(tokens) };
    if (format === "javascript") return { format, content: serializeJavaScriptObject(tokens) };
    if (format === "typescript") return { format, content: serializeTypeScriptObject(tokens) };
    if (format === "tailwind") return { format, content: createTailwindColorData(tokens) };
    if (format === "object") return { format, content: createColorObject(tokens) };
    if (format === "document") return { format, content: createDesignTokenDocument(tokens) };
    throw new InvalidRequestError("format must be css, scss, json, javascript, typescript, tailwind, object, or document");
  });
}
