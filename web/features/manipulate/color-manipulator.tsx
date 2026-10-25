"use client";

import {
  adjustAlpha,
  adjustChroma,
  adjustLightness,
  adjustSaturation,
  compositeColors,
  grayscaleColor,
  invertColor,
  mixColors,
  rotateHue,
  type ColorValue
} from "chromaforge";
import { useState, type FormEvent } from "react";
import { ColorInput } from "@/features/shared/color-input";
import { ColorResult, ToolFeedback, ToolHeading } from "@/features/shared/color-results";
import { FormActions, NumberField, readFiniteNumber, SelectField, SubmitButton } from "@/features/shared/tool-controls";

type Manipulation = "rotate-hue" | "lightness" | "chroma" | "saturation" | "alpha" | "grayscale" | "invert" | "mix" | "composite";

const defaultColor: ColorValue = { format: "hex", value: "#3498db" };
const defaultSecondColor: ColorValue = { format: "hex", value: "#f27b68" };
const defaultCanvas: ColorValue = { format: "hex", value: "#ffffff" };

const operationOptions = [
  { value: "rotate-hue", label: "Rotate hue" },
  { value: "lightness", label: "Adjust OKLCH lightness" },
  { value: "chroma", label: "Adjust OKLCH chroma" },
  { value: "saturation", label: "Adjust OKLCH saturation" },
  { value: "alpha", label: "Adjust alpha" },
  { value: "grayscale", label: "Grayscale" },
  { value: "invert", label: "Invert encoded sRGB" },
  { value: "mix", label: "Mix two colors" },
  { value: "composite", label: "Composite foreground over background" }
] as const;

export function ColorManipulator() {
  const [source, setSource] = useState<ColorValue | undefined>(defaultColor);
  const [secondColor, setSecondColor] = useState<ColorValue | undefined>(defaultSecondColor);
  const [canvas, setCanvas] = useState<ColorValue | undefined>(defaultCanvas);
  const [operation, setOperation] = useState<Manipulation>("lightness");
  const [amount, setAmount] = useState("0.1");
  const [mixWeight, setMixWeight] = useState("0.5");
  const [mixSpace, setMixSpace] = useState<"oklab" | "srgb">("oklab");
  const [useCanvas, setUseCanvas] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [result, setResult] = useState<ColorValue>();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const needsSecondColor = operation === "mix" || operation === "composite";
  const parameter = operation === "rotate-hue"
    ? { label: "Hue rotation (degrees)", hint: "Hue wraps through the package’s OKLCH operation." }
    : operation === "lightness"
      ? { label: "OKLCH lightness delta", hint: "The package clamps the resulting lightness to 0–1." }
      : operation === "chroma"
        ? { label: "OKLCH chroma delta", hint: "The package clamps chroma at zero." }
        : operation === "saturation"
          ? { label: "OKLCH saturation relative delta", min: -1, hint: "A value of 0.5 adds 50% chroma; -1 removes chroma." }
          : operation === "alpha"
            ? { label: "Alpha", min: 0, max: 1, hint: "Opacity from 0 (transparent) to 1 (opaque)." }
            : undefined;

  function updateSource(color: ColorValue | undefined) {
    setSource(color);
    setResult(undefined);
    setFeedback("");
    setError("");
  }

  function updateSecond(color: ColorValue | undefined) {
    setSecondColor(color);
    setResult(undefined);
    setFeedback("");
    setError("");
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!source) {
      setError("Correct the source color before applying this operation.");
      setResult(undefined);
      return;
    }

    try {
      let next: ColorValue;
      let note: string;
      if (operation === "rotate-hue") {
        next = rotateHue(source, readFiniteNumber(amount, "Hue rotation"));
        note = "Hue rotation uses the package’s OKLCH operation.";
      } else if (operation === "lightness") {
        next = adjustLightness(source, readFiniteNumber(amount, "Lightness delta"));
        note = "Lightness adjustment uses OKLCH and the package clamps the resulting L value to 0–1.";
      } else if (operation === "chroma") {
        next = adjustChroma(source, readFiniteNumber(amount, "Chroma delta"));
        note = "Chroma adjustment uses OKLCH and the package clamps chroma at zero.";
      } else if (operation === "saturation") {
        next = adjustSaturation(source, readFiniteNumber(amount, "Saturation relative delta"));
        note = "Saturation is a relative OKLCH chroma delta; the package requires a delta of at least -1.";
      } else if (operation === "alpha") {
        next = adjustAlpha(source, readFiniteNumber(amount, "Alpha"));
        note = "Alpha was set by the package while preserving the requested representation where possible.";
      } else if (operation === "grayscale") {
        next = grayscaleColor(source);
        note = "The package sets OKLCH chroma to zero.";
      } else if (operation === "invert") {
        next = invertColor(source);
        note = "The package inverts mapped encoded sRGB channels and returns the source representation.";
      } else if (!secondColor) {
        throw new Error("Correct the second color before applying this operation.");
      } else if (operation === "mix") {
        next = mixColors(source, secondColor, readFiniteNumber(mixWeight, "Mix weight"), mixSpace);
        note = `The package mixes with premultiplied ${mixSpace === "oklab" ? "OKLab" : "encoded sRGB"} channels.`;
      } else {
        if (useCanvas && !canvas) throw new Error("Correct the canvas color or turn off the canvas option.");
        next = compositeColors(source, secondColor, useCanvas ? canvas : undefined);
        note = "The package composites source-over using encoded-sRGB compositing. An opaque canvas is required for a translucent background.";
      }
      setResult(next);
      setFeedback(note);
      setError("");
    } catch (caught) {
      setResult(undefined);
      setFeedback("");
      setError(caught instanceof Error ? caught.message : "The package could not apply this operation.");
    }
  }

  function reset() {
    setSource(defaultColor);
    setSecondColor(defaultSecondColor);
    setCanvas(defaultCanvas);
    setOperation("lightness");
    setAmount("0.1");
    setMixWeight("0.5");
    setMixSpace("oklab");
    setUseCanvas(false);
    setResetKey((value) => value + 1);
    setResult(undefined);
    setFeedback("");
    setError("");
  }

  return (
    <section className="color-tool" aria-labelledby="manipulator-title">
      <ToolHeading
        id="manipulator-title"
        eyebrow="PACKAGE TOOL · LOCAL CALCULATION"
        title="Color manipulation"
        description="Apply the package’s supported OKLCH adjustments, color mixing, or source-over compositing. Each operation keeps its own documented space and parameters."
      />
      <div className="color-tool__grid">
        <form className="tool-panel" noValidate onSubmit={apply}>
          <h2>Operation</h2>
          <ColorInput key={`source-${resetKey}`} id="manipulate-source" label="Original color" initialColor={defaultColor} onChange={updateSource} />
          <SelectField
            id="manipulate-operation"
            label="Operation"
            value={operation}
            options={operationOptions}
            onChange={(value) => {
              const selected = operationOptions.find((option) => option.value === value);
              if (selected) setOperation(selected.value);
              setResult(undefined);
              setFeedback("");
              setError("");
            }}
          />
          {parameter ? (
            <NumberField
              id="manipulate-amount"
              label={parameter.label}
              value={amount}
              min={"min" in parameter ? parameter.min : undefined}
              max={"max" in parameter ? parameter.max : undefined}
              onChange={setAmount}
              hint={parameter.hint}
            />
          ) : null}
          {needsSecondColor ? (
            <ColorInput
              key={`secondary-${resetKey}`}
              id="manipulate-second"
              label={operation === "mix" ? "Second color to mix" : "Background color"}
              initialColor={defaultSecondColor}
              onChange={updateSecond}
            />
          ) : null}
          {operation === "mix" ? (
            <div className="tool-control-grid">
              <NumberField id="manipulate-weight" label="Second-color weight" value={mixWeight} min={0} max={1} step="0.01" onChange={setMixWeight} hint="The package accepts 0 to 1." />
              <SelectField id="manipulate-mix-space" label="Mix space" value={mixSpace} options={[{ value: "oklab", label: "Premultiplied OKLab" }, { value: "srgb", label: "Premultiplied encoded sRGB" }]} onChange={(value) => { if (value === "oklab" || value === "srgb") setMixSpace(value); }} />
            </div>
          ) : null}
          {operation === "composite" ? (
            <div className="tool-optional-control">
              <label className="tool-check" htmlFor="manipulate-use-canvas">
                <input id="manipulate-use-canvas" type="checkbox" checked={useCanvas} onChange={(event) => setUseCanvas(event.target.checked)} />
                <span>Provide an opaque canvas when the background has transparency</span>
              </label>
              {useCanvas ? <ColorInput key={`canvas-${resetKey}`} id="manipulate-canvas" label="Opaque canvas" initialColor={defaultCanvas} onChange={(color) => { setCanvas(color); setResult(undefined); setError(""); }} /> : null}
            </div>
          ) : null}
          <FormActions>
            <SubmitButton>Apply operation</SubmitButton>
            <button className="tool-button tool-button--quiet" type="button" onClick={reset}>Reset</button>
          </FormActions>
          <ToolFeedback message={error} error />
        </form>

        <section className="tool-panel tool-panel--results" aria-labelledby="manipulated-result-title">
          <h2 id="manipulated-result-title">Before and after</h2>
          <ul className="color-results">
            {source ? <ColorResult label="Original" color={source} /> : <li className="tool-empty">Enter a valid original color.</li>}
            {result ? <ColorResult label="Modified" color={result} /> : <li className="tool-empty">Apply an operation to see its result.</li>}
          </ul>
          <ToolFeedback message={feedback} />
        </section>
      </div>
    </section>
  );
}
