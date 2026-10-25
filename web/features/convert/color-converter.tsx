"use client";

import { convertColor, isColorFormat, type ColorFormat, type ColorValue } from "chromaforge";
import { useState } from "react";
import { ColorInput } from "@/features/shared/color-input";
import { COLOR_FORMATS, COLOR_FORMAT_LABELS } from "@/features/shared/color-format";
import { ColorResultList, ToolFeedback, ToolHeading } from "@/features/shared/color-results";
import { SelectField } from "@/features/shared/tool-controls";

const defaultColor: ColorValue = { format: "hex", value: "#3498db" };

export function ColorConverter() {
  const [source, setSource] = useState<ColorValue | undefined>(defaultColor);
  const [outputFormat, setOutputFormat] = useState<ColorFormat>("rgb");
  const [resetKey, setResetKey] = useState(0);
  let conversion: ReturnType<typeof convertColor> | undefined;
  let conversionError: string | undefined;

  if (source) {
    try {
      conversion = convertColor(source, outputFormat);
    } catch (error) {
      conversionError = error instanceof Error ? error.message : "This color could not be converted.";
    }
  }

  function reset() {
    setSource(defaultColor);
    setOutputFormat("rgb");
    setResetKey((value) => value + 1);
  }

  return (
    <section className="color-tool" aria-labelledby="color-converter-title">
      <ToolHeading
        id="color-converter-title"
        eyebrow="PACKAGE TOOL · LOCAL CALCULATION"
        title="Color converter"
        description="Convert one supported ChromaForge color value into another format. Channel validation, rounding, alpha handling, and gamut metadata come from chromaforge@1.0.1."
      />
      <div className="color-tool__grid">
        <div className="tool-panel">
          <h2 id="converter-title">Input</h2>
          <ColorInput key={resetKey} id="convert-source" label="Source color" initialColor={defaultColor} onChange={setSource} />
          <SelectField
            id="convert-output-format"
            label="Output format"
            value={outputFormat}
            options={COLOR_FORMATS.map((format) => ({ value: format, label: COLOR_FORMAT_LABELS[format] }))}
            onChange={(value) => {
              if (isColorFormat(value)) setOutputFormat(value);
            }}
          />
          <div className="tool-actions">
            <button className="tool-button tool-button--quiet" type="button" onClick={reset}>Reset example</button>
          </div>
          <ToolFeedback message={conversionError} error />
        </div>

        <section className="tool-panel tool-panel--results" aria-labelledby="convert-results-title">
          <h2 id="convert-results-title">Converted value</h2>
          {conversion ? (
            <>
              <ColorResultList
                items={[{ label: COLOR_FORMAT_LABELS[conversion.output.format], color: conversion.output, conversion }]}
                emptyMessage="Enter a color to see its conversion."
              />
              {conversion.gamutMapped ? (
                <p className="tool-note" role="status">
                  Conversion used {conversion.gamutMapping} to fit the requested output gamut. The source value remains unchanged.
                </p>
              ) : null}
            </>
          ) : (
            <p className="tool-empty" role="status">{source ? "The package could not convert this value." : "Correct the input to see a converted value."}</p>
          )}
        </section>
      </div>
    </section>
  );
}
