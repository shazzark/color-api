import type { FastifyInstance } from "fastify";
import { convertColor } from "../color/conversion.js";
import { createTokenResponse } from "../color/tokens.js";
import type { ColorValue } from "../color/types.js";
import {
  InvalidColorError,
  InvalidRequestError,
  isColorFormat,
  validateColorValue,
  validateTokenName
} from "../color/validation.js";

interface TokenRequest {
  name: unknown;
  color: unknown;
  outputFormat?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTokenRequest(body: unknown): body is TokenRequest {
  return isRecord(body)
    && "name" in body
    && "color" in body;
}

function parseColor(value: unknown): ColorValue {
  if (!isRecord(value)
    || typeof value.format !== "string"
    || !("value" in value)
    || !isColorFormat(value.format)) {
    throw new InvalidRequestError("Invalid color envelope");
  }

  return validateColorValue(value.format, value.value);
}

export async function tokenRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/colors/tokens", async (request, reply) => {
    if (!isTokenRequest(request.body)) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Request must include name and color"
        }
      });
    }

    try {
      const name = validateTokenName(request.body.name);
      const input = parseColor(request.body.color);
      const outputFormat = request.body.outputFormat === undefined
        ? "hex"
        : request.body.outputFormat;

      if (typeof outputFormat !== "string"
        || !isColorFormat(outputFormat)) {
        throw new InvalidRequestError("Invalid output format");
      }

      const color = convertColor(
        input.format,
        outputFormat,
        input
      );

      return createTokenResponse(name, color);
    } catch (error: unknown) {
      if (error instanceof InvalidRequestError) {
        return reply.code(400).send({
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

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