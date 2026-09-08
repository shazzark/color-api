import type { FastifyInstance } from "fastify";
import { hexToRgb, InvalidColorError } from "../color/conversion.js";

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

    if (request.body.from !== "hex" || request.body.to !== "rgb") {
      return reply.code(400).send({
        error: {
          code: "UNSUPPORTED_CONVERSION",
          message: "Only HEX to RGB conversion is supported"
        }
      });
    }

    try {
      const rgb = hexToRgb(request.body.value);
      return {
        input: {
          format: "hex",
          value: request.body.value
        },
        output: {
          format: "rgb",
          value: rgb
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
