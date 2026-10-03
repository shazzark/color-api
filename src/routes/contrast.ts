import type { FastifyInstance } from "fastify";
import { analyzeContrast, type ContrastCriterion, type TextSize } from "../color/contrast.js";
import type { ColorValue } from "../color/types.js";
import {
  InvalidColorError,
  isColorFormat,
  validateColorValue
} from "../color/validation.js";

interface ContrastRequest {
  foreground: unknown;
  background: unknown;
  criterion?: unknown;
  textSize?: unknown;
  context?: unknown;
  canvas?: unknown;
}

function isCriterion(value: unknown): value is ContrastCriterion {
  return value === "wcag-2.2-1.4.3" || value === "wcag-2.2-1.4.11";
}
function isTextSize(value: unknown): value is TextSize {
  return value === "normal" || value === "large";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isContrastRequest(body: unknown): body is ContrastRequest {
  return isRecord(body)
    && "foreground" in body
    && "background" in body;
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
      const criterion = request.body.criterion;
      const textSize = request.body.textSize;
      if (criterion !== undefined && !isCriterion(criterion)) {
        return reply.code(400).send({ error: { code: "INVALID_REQUEST", message: "Unsupported contrast criterion" } });
      }
      if (textSize !== undefined && !isTextSize(textSize)) {
        return reply.code(400).send({ error: { code: "INVALID_REQUEST", message: "textSize must be normal or large" } });
      }
      if (request.body.context !== undefined && typeof request.body.context !== "string") {
        return reply.code(400).send({ error: { code: "INVALID_REQUEST", message: "context must be a string" } });
      }
      if (typeof request.body.context === "string" && request.body.context.trim().length === 0) {
        return reply.code(400).send({ error: { code: "INVALID_REQUEST", message: "context must not be empty" } });
      }
      if (criterion === "wcag-2.2-1.4.11" && textSize !== undefined) {
        return reply.code(400).send({ error: { code: "INVALID_REQUEST", message: "textSize does not apply to non-text contrast" } });
      }
      const canvas = request.body.canvas === undefined ? undefined : parseColor(request.body.canvas);
      return analyzeContrast(foreground, background, {
        ...(criterion === undefined ? {} : { criterion }),
        ...(textSize === undefined ? {} : { textSize }),
        ...(typeof request.body.context === "string" ? { context: request.body.context } : {}),
        ...(canvas === undefined ? {} : { canvas })
      });
    } catch (error: unknown) {
      if (error instanceof InvalidColorError) {
        return reply.code(400).send({
          error: {
          code: error.code,
            message: error.message,
            issues: error.issues
          }
        });
      }

      throw error;
    }
  });
}
