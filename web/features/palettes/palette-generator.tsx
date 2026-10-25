"use client";

import {
  convertColor,
  generateHslPalette,
  generateShades,
  generateTints,
  generateTones,
  isColorFormat,
  type ColorFormat,
  type ColorConversionResult,
  type ColorValue,
  type HslColor,
  type PaletteStrategy
} from "chromaforge";
import { useState, type FormEvent } from "react";
import { ColorInput } from "@/features/shared/color-input";
import { COLOR_FORMATS, COLOR_FORMAT_LABELS } from "@/features/shared/color-format";
import { ColorResultList, ToolFeedback, ToolHeading } from "@/features/shared/color-results";
import { FormActions, NumberField, readFiniteNumber, SelectField, SubmitButton } from "@/features/shared/tool-controls";

type PaletteMode = "harmony" | "variants";
type VariantMethod = "shades" | "tints" | "tones";
type PaletteItem = { label: string; color: ColorValue; conversion: ReturnType<typeof convertColor> };

function hslValue(color: HslColor): ColorValue {
  return { format: "hsl", value: color };
}

const defaultColor: ColorValue = { format: "hex", value: "#3498db" };
const strategies: readonly { value: PaletteStrategy; label: string }[] = [
  { value: "complementary", label: "Complementary" },
  { value: "analogous", label: "Analogous" },
  { value: "triadic", label: "Triadic" },
  { value: "tetradic", label: "Tetradic" },
  { value: "split-complementary", label: "Split-complementary" },
  { value: "monochromatic", label: "Monochromatic" }
];

function paletteStrategy(value: string): PaletteStrategy | undefined {
  return strategies.find((strategy) => strategy.value === value)?.value;
}

export function PaletteGenerator() {
  const [baseColor, setBaseColor] = useState<ColorValue | undefined>(defaultColor);
  const [mode, setMode] = useState<PaletteMode>("harmony");
  const [strategy, setStrategy] = useState<PaletteStrategy>("analogous");
  const [variant, setVariant] = useState<VariantMethod>("shades");
  const [count, setCount] = useState("5");
  const [outputFormat, setOutputFormat] = useState<ColorFormat>("hex");
  const [items, setItems] = useState<PaletteItem[]>([]);
  const [error, setError] = useState("");

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!baseColor) {
      setError("Enter a valid base color before generating a palette.");
      setItems([]);
      return;
    }

    try {
      const generated: ColorConversionResult[] = mode === "harmony"
        ? (() => {
            const hsl = convertColor(baseColor, "hsl").output;
            if (hsl.format !== "hsl") throw new Error("The package did not return an HSL base color.");
            const options = strategy === "analogous" ? { count: readFiniteNumber(count, "Palette count") } : undefined;
            return generateHslPalette(hsl.value, strategy, options)
              .map(hslValue)
              .map((color) => convertColor(color, outputFormat));
          })()
        : (() => {
            const variantCount = readFiniteNumber(count, "Variant count");
            if (variant === "shades") return generateShades(baseColor, variantCount, outputFormat);
            if (variant === "tints") return generateTints(baseColor, variantCount, outputFormat);
            return generateTones(baseColor, variantCount, outputFormat);
          })();

      const nextItems = generated.map((conversion, index) => {
        return { label: `Color ${index + 1}`, color: conversion.output, conversion };
      });
      setItems(nextItems);
      setError("");
    } catch (caught) {
      setItems([]);
      setError(caught instanceof Error ? caught.message : "The package could not generate this palette.");
    }
  }

  function reset() {
    setBaseColor(defaultColor);
    setMode("harmony");
    setStrategy("analogous");
    setVariant("shades");
    setCount("5");
    setOutputFormat("hex");
    setItems([]);
    setError("");
  }

  return (
    <section className="color-tool" aria-labelledby="palette-title">
      <ToolHeading
        id="palette-title"
        eyebrow="PACKAGE TOOL · LOCAL CALCULATION"
        title="Palette generator"
        description="Build an HSL harmony palette or generate perceptual shades, tints, and tones. Each method calls its published package operation."
      />
      <div className="color-tool__grid">
        <form className="tool-panel" noValidate onSubmit={generate}>
          <h2>Palette settings</h2>
          <ColorInput id="palette-base" label="Base color" initialColor={defaultColor} onChange={setBaseColor} />
          <SelectField
            id="palette-mode"
            label="Palette method group"
            value={mode}
            options={[{ value: "harmony", label: "HSL harmony" }, { value: "variants", label: "Shades, tints, or tones" }]}
            onChange={(value) => { if (value === "harmony" || value === "variants") setMode(value); }}
          />
          {mode === "harmony" ? (
            <>
              <SelectField id="palette-strategy" label="HSL harmony method" value={strategy} options={strategies} onChange={(value) => { const selected = paletteStrategy(value); if (selected) setStrategy(selected); }} />
              {strategy === "analogous" ? (
                <NumberField id="palette-count" label="Palette count (2–12)" value={count} min={2} max={12} step="1" onChange={setCount} hint="A count can be selected only for analogous palettes." />
              ) : <p className="tool-help">This method uses its package-defined palette size.</p>}
            </>
          ) : (
            <>
              <SelectField id="palette-variant" label="Variant method" value={variant} options={[{ value: "shades", label: "Shades" }, { value: "tints", label: "Tints" }, { value: "tones", label: "Tones" }]} onChange={(value) => { if (value === "shades" || value === "tints" || value === "tones") setVariant(value); }} />
              <NumberField id="palette-variant-count" label="Variant count (2–101)" value={count} min={2} max={101} step="1" onChange={setCount} />
            </>
          )}
          <SelectField id="palette-output-format" label="Output format" value={outputFormat} options={COLOR_FORMATS.map((format) => ({ value: format, label: COLOR_FORMAT_LABELS[format] }))} onChange={(value) => { if (isColorFormat(value)) setOutputFormat(value); }} />
          <FormActions>
            <SubmitButton>Generate palette</SubmitButton>
            <button className="tool-button tool-button--quiet" type="button" onClick={reset}>Reset</button>
          </FormActions>
          <ToolFeedback message={error} error />
        </form>

        <section className="tool-panel tool-panel--results" aria-labelledby="palette-results-title">
          <h2 id="palette-results-title">Generated colors</h2>
          <ColorResultList items={items} emptyMessage="Choose a method and generate a palette." />
        </section>
      </div>
    </section>
  );
}
