import type { FastifyInstance } from "fastify";
import { analyzeContrast } from "../color/contrast.js";
import { convertColor } from "../color/conversion.js";
import type { ColorValue } from "../color/types.js";
import {
  InvalidColorError,
  isColorFormat,
  validateColorValue
} from "../color/validation.js";

interface ContrastRequest {
  foreground: unknown;
  background: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isContrastRequest(body: unknown): body is ContrastRequest {
  return isRecord(body)
    && "foreground" in body
    && "background" in body;
}

function toRgb(value: ColorValue) {
  const converted = convertColor(value.format, "rgb", value);

  if (converted.format !== "rgb") {
    throw new InvalidColorError("Unable to normalize color to RGB");
  }

  return converted.value;
}

function parseColor(value: unknown): ColorValue {
  if (!isRecord(value)
    || typeof value.format !== "string"
    || !("value" in value)) {
    throw new InvalidColorError("Invalid color value");
  }

  if (!isColorFormat(value.format)) {
    throw new InvalidColorError("Invalid color format");
  }

  return validateColorValue(value.format, value.value);
}

export async function contrastRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/colors/contrast", async (request, reply) => {
    if (!isContrastRequest(request.body)) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Request must include foreground and background colors"
        }
      });
    }

    try {
      const foreground = parseColor(request.body.foreground);
      const background = parseColor(request.body.background);
      const result = analyzeContrast(toRgb(foreground), toRgb(background));

      return {
        foreground: request.body.foreground,
        background: request.body.background,
        ...result
      };
    } catch (error: unknown) {
      if (error instanceof InvalidColorError) {
        return reply.code(400).send({
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      throw error;
    }
  });
}