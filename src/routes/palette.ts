import type { FastifyInstance } from "fastify";
import { convertColor } from "../color/conversion.js";
import { generateHslPalette } from "../color/palette.js";
import type {
  ColorFormat,
  ColorValue,
  PaletteStrategy
} from "../color/types.js";
import {
  InvalidColorError,
  isColorFormat,
  validateColorValue
} from "../color/validation.js";

interface PaletteRequest {
  base: unknown;
  strategy: string;
  outputFormat?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPaletteRequest(body: unknown): body is PaletteRequest {
  return isRecord(body)
    && "base" in body
    && typeof body.strategy === "string";
}

function isPaletteStrategy(value: string): value is PaletteStrategy {
  return value === "complementary"
    || value === "analogous"
    || value === "triadic"
    || value === "split-complementary"
    || value === "monochromatic";
}

function parseBaseColor(value: unknown): ColorValue {
  if (!isRecord(value)
    || typeof value.format !== "string"
    || !("value" in value)
    || !isColorFormat(value.format)) {
    throw new InvalidColorError("Invalid base color value");
  }

  return validateColorValue(value.format, value.value);
}

function toHsl(value: ColorValue) {
  const rgb = convertColor(value.format, "rgb", value);

  if (rgb.format !== "rgb") {
    throw new InvalidColorError("Unable to normalize base color to RGB");
  }

  const hsl = convertColor("rgb", "hsl", rgb);

  if (hsl.format !== "hsl") {
    throw new InvalidColorError("Unable to normalize base color to HSL");
  }

  return hsl.value;
}

function toOutputColor(
  value: ColorValue,
  outputFormat: ColorFormat
): ColorValue {
  return convertColor(value.format, outputFormat, value);
}

export async function paletteRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/colors/palette", async (request, reply) => {
    if (!isPaletteRequest(request.body)) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Request must include base and strategy"
        }
      });
    }

    if (!isPaletteStrategy(request.body.strategy)) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid palette strategy"
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

    try {
      const base = parseBaseColor(request.body.base);
      const palette = generateHslPalette(toHsl(base), request.body.strategy);
      const colors = palette.map((hsl) => {
        const generated: ColorValue = { format: "hsl", value: hsl };
        const output = toOutputColor(generated, outputFormat);
        return output;
      });

      return {
        base: request.body.base,
        strategy: request.body.strategy,
        outputFormat,
        colors
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