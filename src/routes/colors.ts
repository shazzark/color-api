import type { FastifyInstance } from "fastify";
import { convertColor } from "../color/conversion.js";
import {
  InvalidColorError,
  isColorFormat,
  validateColorValue
} from "../color/validation.js";
import type { ColorFormat } from "../color/types.js";

interface ConvertRequest {
  from: string;
  to: string;
  value: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isConvertRequest(body: unknown): body is ConvertRequest {
  if (!isRecord(body)) {
    return false;
  }

  return typeof body.from === "string"
    && typeof body.to === "string"
    && "value" in body;
}

export async function colorRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/colors/convert", async (request, reply) => {
    if (!isConvertRequest(request.body)) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Request must include string fields: from, to, and value"
        }
      });
    }

    if (!isColorFormat(request.body.from)
      || !isColorFormat(request.body.to)
      || request.body.from === request.body.to) {
      return reply.code(400).send({
        error: {
          code: "UNSUPPORTED_CONVERSION",
          message: "Supported conversions are between HEX, RGB, HSL, and HSV"
        }
      });
    }

    try {
      const from: ColorFormat = request.body.from;
      const to: ColorFormat = request.body.to;
      const input = validateColorValue(from, request.body.value);
      const output = convertColor(from, to, input);

      return {
        input: {
          format: input.format,
          value: input.value
        },
        output: {
          format: output.format,
          value: output.value
        }
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
