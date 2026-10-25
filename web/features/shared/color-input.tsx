"use client";

import { convertColor, type ColorFormat, type ColorValue } from "chromaforge";
import { useState } from "react";
import {
  COLOR_FIELDS,
  COLOR_FORMATS,
  COLOR_FORMAT_LABELS,
  colorFormatFromSelection,
  draftFromColor,
  parseColorDraft,
  type ColorDraft
} from "@/features/shared/color-format";

const defaultColor: ColorValue = { format: "hex", value: "#3498db" };

interface ColorInputProps {
  id: string;
  label: string;
  initialColor?: ColorValue;
  onChange: (color: ColorValue | undefined) => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Enter a valid color value.";
}

export function ColorInput({ id, label, initialColor = defaultColor, onChange }: ColorInputProps) {
  const [format, setFormat] = useState<ColorFormat>(initialColor.format);
  const [draft, setDraft] = useState<ColorDraft>(() => draftFromColor(initialColor));
  const [lastValidColor, setLastValidColor] = useState<ColorValue>(initialColor);
  const [error, setError] = useState<string>();
  const errorId = `${id}-error`;

  function commit(nextFormat: ColorFormat, nextDraft: ColorDraft) {
    setDraft(nextDraft);
    try {
      const color = parseColorDraft(nextFormat, nextDraft);
      setLastValidColor(color);
      setError(undefined);
      onChange(color);
    } catch (caught) {
      setError(errorMessage(caught));
      onChange(undefined);
    }
  }

  function changeFormat(nextFormat: ColorFormat) {
    try {
      const converted = convertColor(lastValidColor, nextFormat).output;
      setFormat(nextFormat);
      setDraft(draftFromColor(converted));
      setLastValidColor(converted);
      setError(undefined);
      onChange(converted);
    } catch (caught) {
      setError(errorMessage(caught));
      onChange(undefined);
    }
  }

  const fields = COLOR_FIELDS[format];

  function handleFormatChange(value: string) {
    const selected = colorFormatFromSelection(value);
    if (selected) changeFormat(selected);
  }

  return (
    <fieldset className="color-input">
      <legend>{label}</legend>
      <label className="tool-field" htmlFor={`${id}-format`}>
        <span>Input format</span>
        <select id={`${id}-format`} value={format} onChange={(event) => handleFormatChange(event.target.value)}>
          {COLOR_FORMATS.map((option) => <option key={option} value={option}>{COLOR_FORMAT_LABELS[option]}</option>)}
        </select>
      </label>

      {format === "hex" ? (
        <label className="tool-field" htmlFor={`${id}-value`}>
          <span>HEX value <small>Use 6 or 8 digits; 8-digit HEX includes alpha.</small></span>
          <input
            id={`${id}-value`}
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={draft.value ?? ""}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => commit(format, { value: event.target.value })}
          />
        </label>
      ) : (
        <div className="color-input__fields">
          {fields?.map((field) => (
            <label className="tool-field" htmlFor={`${id}-${field.key}`} key={field.key}>
              <span>{field.label}</span>
              <input
                id={`${id}-${field.key}`}
                type="number"
                inputMode="decimal"
                autoComplete="off"
                value={draft[field.key] ?? ""}
                min={field.min}
                max={field.max}
                step={field.step}
                required={!field.optional}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => commit(format, { ...draft, [field.key]: event.target.value })}
              />
            </label>
          ))}
        </div>
      )}
      {format === "hsl" || format === "hsv" || format === "oklch" ? (
        <p className="tool-help">Hue is normalized by the package. Alpha is optional and ranges from 0 to 1.</p>
      ) : format === "oklab" || format === "rgb" ? (
        <p className="tool-help">Alpha is optional and ranges from 0 to 1.</p>
      ) : null}
      {error ? <p className="tool-error" id={errorId} role="alert">{error}</p> : null}
    </fieldset>
  );
}
