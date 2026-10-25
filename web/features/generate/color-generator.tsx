"use client";

import { convertColor, generateColors, isColorFormat, type ColorFormat, type ColorValue } from "chromaforge";
import { useState, type FormEvent } from "react";
import { COLOR_FORMATS, COLOR_FORMAT_LABELS } from "@/features/shared/color-format";
import { ColorResultList, ToolFeedback, ToolHeading } from "@/features/shared/color-results";
import { FormActions, NumberField, readFiniteNumber, SelectField, SubmitButton, TextField } from "@/features/shared/tool-controls";

interface GeneratedItem {
  label: string;
  color: ColorValue;
  conversion: ReturnType<typeof convertColor>;
}

const initialRanges = {
  lightnessMin: "0",
  lightnessMax: "1",
  chromaMin: "0",
  chromaMax: "0.4",
  hueMin: "0",
  hueMax: "360"
};

export function ColorGenerator() {
  const [count, setCount] = useState("12");
  const [seed, setSeed] = useState("chromaforge");
  const [ranges, setRanges] = useState(initialRanges);
  const [outputFormat, setOutputFormat] = useState<ColorFormat>("hex");
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [algorithm, setAlgorithm] = useState("");
  const [error, setError] = useState("");

  function updateRange(field: keyof typeof initialRanges, value: string) {
    setRanges((current) => ({ ...current, [field]: value }));
  }

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const countValue = readFiniteNumber(count, "Color count");
      const result = generateColors(countValue, {
        ...(seed === "" ? {} : { seed }),
        constraints: {
          lightness: [readFiniteNumber(ranges.lightnessMin, "Minimum lightness"), readFiniteNumber(ranges.lightnessMax, "Maximum lightness")],
          chroma: [readFiniteNumber(ranges.chromaMin, "Minimum chroma"), readFiniteNumber(ranges.chromaMax, "Maximum chroma")],
          hue: [readFiniteNumber(ranges.hueMin, "Minimum hue"), readFiniteNumber(ranges.hueMax, "Maximum hue")]
        }
      });
      const converted = result.colors.map((color, index) => {
        const conversion = convertColor(color, outputFormat);
        return { label: `Color ${index + 1}`, color: conversion.output, conversion };
      });
      setItems(converted);
      setAlgorithm(result.algorithm === "Math.random"
        ? "Unseeded output uses Math.random and varies each time."
        : `Seeded output uses ${result.algorithm}; the same seed and bounds reproduce this set.`);
      setError("");
    } catch (caught) {
      setItems([]);
      setAlgorithm("");
      setError(caught instanceof Error ? caught.message : "The package could not generate this color set.");
    }
  }

  function reset() {
    setCount("12");
    setSeed("chromaforge");
    setRanges(initialRanges);
    setOutputFormat("hex");
    setItems([]);
    setAlgorithm("");
    setError("");
  }

  return (
    <section className="color-tool" aria-labelledby="generator-title">
      <ToolHeading
        id="generator-title"
        eyebrow="PACKAGE TOOL · LOCAL CALCULATION"
        title="Color generator"
        description="Generate colors in the package’s OKLCH ranges. Seeded output is reproducible; leaving the seed empty uses the package’s unseeded mode."
      />
      <div className="color-tool__grid">
        <form className="tool-panel" noValidate onSubmit={generate}>
          <h2>Generation settings</h2>
          <div className="tool-control-grid">
            <NumberField id="generate-count" label="Number of colors (1–1000)" value={count} min={1} max={1000} step="1" onChange={setCount} />
            <TextField id="generate-seed" label="Seed (optional)" value={seed} onChange={setSeed} hint="Clear this field for non-reproducible output." />
          </div>
          <fieldset className="tool-range-group">
            <legend>OKLCH lightness · 0 to 1</legend>
            <div className="tool-control-grid">
              <NumberField id="generate-lightness-min" label="Minimum" value={ranges.lightnessMin} min={0} max={1} step="0.01" onChange={(value) => updateRange("lightnessMin", value)} />
              <NumberField id="generate-lightness-max" label="Maximum" value={ranges.lightnessMax} min={0} max={1} step="0.01" onChange={(value) => updateRange("lightnessMax", value)} />
            </div>
          </fieldset>
          <fieldset className="tool-range-group">
            <legend>OKLCH chroma · 0 to 0.4</legend>
            <div className="tool-control-grid">
              <NumberField id="generate-chroma-min" label="Minimum" value={ranges.chromaMin} min={0} max={0.4} step="0.01" onChange={(value) => updateRange("chromaMin", value)} />
              <NumberField id="generate-chroma-max" label="Maximum" value={ranges.chromaMax} min={0} max={0.4} step="0.01" onChange={(value) => updateRange("chromaMax", value)} />
            </div>
          </fieldset>
          <fieldset className="tool-range-group">
            <legend>OKLCH hue · 0 to 360 degrees</legend>
            <div className="tool-control-grid">
              <NumberField id="generate-hue-min" label="Minimum" value={ranges.hueMin} min={0} max={360} step="1" onChange={(value) => updateRange("hueMin", value)} />
              <NumberField id="generate-hue-max" label="Maximum" value={ranges.hueMax} min={0} max={360} step="1" onChange={(value) => updateRange("hueMax", value)} />
            </div>
          </fieldset>
          <SelectField
            id="generate-output-format"
            label="Output format"
            value={outputFormat}
            options={COLOR_FORMATS.map((format) => ({ value: format, label: COLOR_FORMAT_LABELS[format] }))}
            onChange={(value) => {
              if (isColorFormat(value)) setOutputFormat(value);
            }}
          />
          <FormActions>
            <SubmitButton>Generate colors</SubmitButton>
            <button className="tool-button tool-button--quiet" type="button" onClick={reset}>Reset</button>
          </FormActions>
          <ToolFeedback message={error} error />
        </form>

        <section className="tool-panel tool-panel--results" aria-labelledby="generated-colors-title">
          <h2 id="generated-colors-title">Generated colors</h2>
          <ToolFeedback message={algorithm} />
          <ColorResultList items={items} emptyMessage="Choose the ranges and generate a color set." />
        </section>
      </div>
    </section>
  );
}
