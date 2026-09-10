import type { FastifyInstance } from "fastify";
import {
  hexToHsl,
  hexToHsv,
  hexToRgb,
  InvalidColorError
} from "../color/conversion.js";

interface ConvertRequest {
  from: string;
  to: string;
  value: string;
}

function isConvertRequest(body: unknown): body is ConvertRequest {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const request = body as Record<string, unknown>;
  return typeof request.from === "string"
    && typeof request.to === "string"
    && typeof request.value === "string";
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

    if (request.body.from !== "hex"
      || !["rgb", "hsl", "hsv"].includes(request.body.to)) {
      return reply.code(400).send({
        error: {
          code: "UNSUPPORTED_CONVERSION",
          message: "Supported conversions are HEX to RGB, HEX to HSL, and HEX to HSV"
        }
      });
    }

    try {
      const output = request.body.to === "rgb"
        ? { format: "rgb", value: hexToRgb(request.body.value) }
        : request.body.to === "hsl"
          ? { format: "hsl", value: hexToHsl(request.body.value) }
          : { format: "hsv", value: hexToHsv(request.body.value) };

      return {
        input: {
          format: "hex",
          value: request.body.value
        },
        output
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
