import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { adjustLightness, analyzeColor, generateOklchScale, serializeJavaScriptObject, suggestContrastingColors } from "../src/index.js";

describe("operation API routes", () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });

  it("validates and normalizes colors through shared domain operations", async () => {
    const valid = await app.inject({ method: "POST", url: "/v1/colors/validate", payload: { color: { format: "hex", value: "#AABBCC" } } });
    const normalized = await app.inject({ method: "POST", url: "/v1/colors/normalize", payload: { color: { format: "hex", value: "#AABBCC" } } });
    expect(valid.json().valid).toBe(true);
    expect(normalized.json()).toEqual({ format: "hex", value: "#aabbcc" });
  });

  it("bounds generated colors and returns seeded output", async () => {
    const payload = { count: 3, seed: "api" };
    const a = await app.inject({ method: "POST", url: "/v1/colors/generate", payload });
    const b = await app.inject({ method: "POST", url: "/v1/colors/generate", payload });
    expect(a.json()).toEqual(b.json());
    expect((await app.inject({ method: "POST", url: "/v1/colors/generate", payload: { count: 101 } })).statusCode).toBe(400);
  });

  it("keeps mixing separate from alpha compositing and exposes analysis", async () => {
    const first = { format: "hex", value: "#ff000080" };
    const second = { format: "hex", value: "#0000ff" };
    const mixed = await app.inject({ method: "POST", url: "/v1/colors/mix", payload: { first, second } });
    const composited = await app.inject({ method: "POST", url: "/v1/colors/composite", payload: { foreground: first, background: second } });
    expect(mixed.json().output.value).not.toEqual(composited.json().output.value);
    expect((await app.inject({ method: "POST", url: "/v1/colors/analyze", payload: { color: second } })).statusCode).toBe(200);
    expect((await app.inject({ method: "POST", url: "/v1/colors/distance", payload: { first, second } })).json().metric).toBe("deltaEOK");
  });

  it("validates scale and token serialization bounds", async () => {
    const scale = await app.inject({ method: "POST", url: "/v1/colors/scales/variants", payload: { color: { format: "hex", value: "#336699" }, kind: "shades", count: 3 } });
    expect(scale.statusCode).toBe(200);
    const tokens = await app.inject({ method: "POST", url: "/v1/colors/tokens/serialize", payload: { format: "css", tokens: { brand: { format: "hex", value: "#336699" } } } });
    expect(tokens.json().content).toContain("--color-brand: #336699;");
    expect((await app.inject({ method: "POST", url: "/v1/colors/tokens/serialize", payload: { format: "css", tokens: { "bad;name": { format: "hex", value: "#336699" } } } })).statusCode).toBe(400);
  });

  it("matches package results for manipulation, OKLCH scales, suggestions, and serializers", async () => {
    const color = { format: "hex" as const, value: "#336699" };
    const manipulated = await app.inject({ method: "POST", url: "/v1/colors/manipulate", payload: { operation: "adjustLightness", color, amount: 0.1 } });
    expect(manipulated.json().output).toEqual(adjustLightness(color, 0.1));

    const stops = [
      { position: 0, color: { format: "oklch" as const, value: { l: 0.4, c: 0.1, h: 250 } } },
      { position: 1, color: { format: "oklch" as const, value: { l: 0.8, c: 0.1, h: 250 } } }
    ];
    const scale = await app.inject({ method: "POST", url: "/v1/colors/scales/oklch", payload: { stops, count: 3, outputFormat: "oklch" } });
    expect(scale.json()).toEqual(generateOklchScale(stops, 3, "oklch"));

    const suggestionInput = { foreground: color, background: { format: "hex" as const, value: "#ffffff" } };
    const suggestions = await app.inject({ method: "POST", url: "/v1/colors/contrast/suggestions", payload: suggestionInput });
    expect(suggestions.json()).toEqual(suggestContrastingColors(suggestionInput.foreground, suggestionInput.background));

    const analysis = await app.inject({ method: "POST", url: "/v1/colors/analyze", payload: { color } });
    expect(analysis.json()).toEqual(analyzeColor(color));
    const tokens = { brand: color };
    const serialized = await app.inject({ method: "POST", url: "/v1/colors/tokens/serialize", payload: { tokens, format: "javascript" } });
    expect(serialized.json().content).toBe(serializeJavaScriptObject(tokens));
  });

  it("rejects contradictory contrast suggestion context and null enums", async () => {
    const colors = {
      foreground: { format: "hex", value: "#777777" },
      background: { format: "hex", value: "#ffffff" }
    };
    for (const payload of [
      { ...colors, criterion: "wcag-2.2-1.4.11", textSize: "normal", context: "icon boundary" },
      { ...colors, criterion: "wcag-2.2-1.4.11", textSize: "large", context: "icon boundary" },
      { ...colors, criterion: null },
      { ...colors, textSize: null }
    ]) {
      expect((await app.inject({ method: "POST", url: "/v1/colors/contrast/suggestions", payload })).statusCode).toBe(400);
    }
  });
});
