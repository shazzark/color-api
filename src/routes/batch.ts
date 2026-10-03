import type { FastifyInstance } from "fastify";
import { convertColor } from "../color/conversion.js";
import type {
  BatchConversionResponse,
  ColorConversionResult,
  ColorValue
} from "../color/types.js";
import {
  InvalidColorError,
  isColorFormat,
  validateColorValue
} from "../color/validation.js";

const MAX_BATCH_SIZE = 100;

interface BatchConvertRequest {
  colors: unknown;
  outputFormat?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBatchConvertRequest(body: unknown): body is BatchConvertRequest {
  return isRecord(body) && "colors" in body;
}

function parseColor(value: unknown): ColorValue {
  if (!isRecord(value)
    || typeof value.format !== "string"
    || !("value" in value)
    || !isColorFormat(value.format)) {
    throw new InvalidColorError("Invalid color value");
  }

  return validateColorValue(value.format, value.value);
}

export async function batchRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/colors/batch/convert", async (request, reply) => {
    if (!isBatchConvertRequest(request.body)
      || !Array.isArray(request.body.colors)) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Request must include a colors array"
        }
      });
    }

    const { colors } = request.body;

    if (colors.length < 1 || colors.length > MAX_BATCH_SIZE) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Colors must contain between 1 and 100 items"
        }
      });
    }

    const outputFormat = request.body.outputFormat === undefined
      ? "hex"
      : request.body.outputFormat;

    if (typeof outputFormat !== "string"
      || !isColorFormat(outputFormat)) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid output format"
        }
      });
    }

    const results: ColorConversionResult[] = [];

    for (const [index, value] of colors.entries()) {
      try {
        const input = parseColor(value);
        results.push(convertColor(input, outputFormat));
      } catch (error: unknown) {
        if (error instanceof InvalidColorError) {
          return reply.code(400).send({
            error: {
            code: error.code,
            message: error.message,
            index,
            issues: error.issues.map((issue) => ({
              ...issue,
              path: issue.path === "/" ? `/colors/${index}` : `/colors/${index}${issue.path}`,
              index
            }))
            }
          });
        }

        throw error;
      }
    }

    const response: BatchConversionResponse = { results };
    return response;
  });
}
