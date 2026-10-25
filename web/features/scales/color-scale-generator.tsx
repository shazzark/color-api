"use client";

import {
  generateOklchScale,
  isColorFormat,
  type ColorFormat,
  type ColorValue,
  type OklchStop,
  type ScaleColor
} from "chromaforge";
import { useRef, useState, type FormEvent } from "react";
import { ColorInput } from "@/features/shared/color-input";
import { COLOR_FORMATS, COLOR_FORMAT_LABELS } from "@/features/shared/color-format";
import { ColorResultList, ToolFeedback, ToolHeading } from "@/features/shared/color-results";
import { FormActions, NumberField, readFiniteNumber, SelectField, SubmitButton } from "@/features/shared/tool-controls";

interface EditableStop {
  id: string;
  position: string;
  color?: ColorValue;
}

const firstColor: ColorValue = { format: "hex", value: "#000000" };
const lastColor: ColorValue = { format: "hex", value: "#ffffff" };
const initialStops: EditableStop[] = [
  { id: "start", position: "0", color: firstColor },
  { id: "end", position: "1", color: lastColor }
];

export function ColorScaleGenerator() {
  const [stops, setStops] = useState<EditableStop[]>(initialStops);
  const [count, setCount] = useState("9");
  const [outputFormat, setOutputFormat] = useState<ColorFormat>("hex");
  const [items, setItems] = useState<ScaleColor[]>([]);
  const [error, setError] = useState("");
  const nextStopId = useRef(0);

  function updateStop(id: string, update: Partial<EditableStop>) {
    setStops((current) => current.map((stop) => stop.id === id ? { ...stop, ...update } : stop));
    setItems([]);
    setError("");
  }

  function addStop() {
    const ordered = stops.map((stop, index) => ({ stop, index, position: Number(stop.position) }));
    let widestGap = -1;
    let insertAfter = 0;
    for (let index = 0; index < ordered.length - 1; index += 1) {
      const gap = ordered[index + 1].position - ordered[index].position;
      if (Number.isFinite(gap) && gap > widestGap) {
        widestGap = gap;
        insertAfter = index;
      }
    }
    if (widestGap <= 0) {
      setError("Correct the stop positions before adding another stop.");
      return;
    }

    const lower = ordered[insertAfter];
    const upper = ordered[insertAfter + 1];
    const stop: EditableStop = {
      id: `stop-${nextStopId.current++}`,
      position: String((lower.position + upper.position) / 2),
      color: lower.stop.color ?? firstColor
    };
    setStops((current) => {
      const updated = [...current];
      updated.splice(upper.index, 0, stop);
      return updated;
    });
    setItems([]);
    setError("");
  }

  function removeStop(id: string) {
    setStops((current) => current.filter((stop) => stop.id !== id));
    setItems([]);
    setError("");
  }

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const stopValues: OklchStop[] = stops.map((stop, index) => {
        if (!stop.color) throw new Error(`Enter a valid color for stop ${index + 1}.`);
        return {
          position: readFiniteNumber(stop.position, `Position for stop ${index + 1}`),
          color: stop.color
        };
      });
      const scale = generateOklchScale(stopValues, readFiniteNumber(count, "Scale count"), outputFormat);
      setItems(scale);
      setError("");
    } catch (caught) {
      setItems([]);
      setError(caught instanceof Error ? caught.message : "The package could not generate this scale.");
    }
  }

  function reset() {
    setStops(initialStops);
    setCount("9");
    setOutputFormat("hex");
    setItems([]);
    setError("");
    nextStopId.current = 0;
  }

  return (
    <section className="color-tool" aria-labelledby="scale-title">
      <ToolHeading
        id="scale-title"
        eyebrow="PACKAGE TOOL · LOCAL CALCULATION"
        title="OKLCH color scales"
        description="Set ordered color stops and ask the package to generate a perceptual scale. Stop order, lightness, alpha, and gamut rules are validated by chromaforge@1.0.1."
      />
      <div className="color-tool__grid">
        <form className="tool-panel" noValidate onSubmit={generate}>
          <h2>Scale settings</h2>
          <div className="scale-stops">
            {stops.map((stop, index) => {
              const isEndpoint = index === 0 || index === stops.length - 1;
              return (
                <fieldset className="scale-stop" key={stop.id}>
                  <legend>Stop {index + 1}{isEndpoint ? (index === 0 ? " · start" : " · end") : ""}</legend>
                  <NumberField
                    id={`scale-position-${stop.id}`}
                    label="Position (0–1)"
                    value={stop.position}
                    min={0}
                    max={1}
                    step="0.01"
                    onChange={(position) => updateStop(stop.id, { position })}
                    hint={isEndpoint ? `Fixed at ${index === 0 ? "0" : "1"} by the package contract.` : undefined}
                    disabled={isEndpoint}
                  />
                  {!isEndpoint ? (
                    <button className="tool-button tool-button--quiet" type="button" onClick={() => removeStop(stop.id)} aria-label={`Remove stop ${index + 1}`}>
                      Remove stop
                    </button>
                  ) : null}
                  <ColorInput
                    key={stop.id}
                    id={`scale-color-${stop.id}`}
                    label={`Color for stop ${index + 1}`}
                    initialColor={stop.color ?? firstColor}
                    onChange={(color) => updateStop(stop.id, { color })}
                  />
                </fieldset>
              );
            })}
          </div>
          <div className="tool-control-grid">
            <NumberField id="scale-count" label="Scale steps (2–101)" value={count} min={2} max={101} step="1" onChange={(value) => { setCount(value); setItems([]); }} />
            <SelectField id="scale-output-format" label="Output format" value={outputFormat} options={COLOR_FORMATS.map((format) => ({ value: format, label: COLOR_FORMAT_LABELS[format] }))} onChange={(value) => { if (isColorFormat(value)) { setOutputFormat(value); setItems([]); } }} />
          </div>
          <FormActions>
            <button className="tool-button tool-button--quiet" type="button" disabled={stops.length >= 10} onClick={addStop}>Add stop</button>
            <SubmitButton>Generate scale</SubmitButton>
            <button className="tool-button tool-button--quiet" type="button" onClick={reset}>Reset</button>
          </FormActions>
          <ToolFeedback message={error} error />
        </form>

        <section className="tool-panel tool-panel--results" aria-labelledby="scale-results-title">
          <h2 id="scale-results-title">Scale steps</h2>
          <ColorResultList
            items={items.map((step, index) => ({ label: `Step ${index + 1} · ${step.position}`, color: step.output, conversion: step }))}
            emptyMessage="Set at least two stops and generate a scale."
          />
        </section>
      </div>
    </section>
  );
}
