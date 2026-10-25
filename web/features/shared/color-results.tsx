"use client";

import type { ColorConversionResult, ColorValue } from "chromaforge";
import { useState } from "react";
import { colorPreviewHex, formattedColorValue } from "@/features/shared/color-format";

interface ColorResultProps {
  label: string;
  color: ColorValue;
  conversion?: ColorConversionResult;
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copied.");
    } catch {
      setStatus("Clipboard access is unavailable. Select and copy the value shown.");
    }
  }

  return (
    <span className="copy-control">
      <button className="tool-button tool-button--quiet" type="button" onClick={copy} aria-label={`Copy value for ${label}`}>
        Copy value
      </button>
      <span className="visually-hidden" role="status" aria-live="polite">{status}</span>
    </span>
  );
}

export function ColorResult({ label, color, conversion }: ColorResultProps) {
  const preview = colorPreviewHex(color);
  const valueText = formattedColorValue(color);
  const isMapped = conversion?.gamutMapped ?? preview.gamutMapped;

  return (
    <li className="color-result">
      <span className="color-result__swatch" style={{ backgroundColor: preview.hex }} aria-hidden="true" />
      <div className="color-result__body">
        <strong>{label}</strong>
        <code>{valueText}</code>
        {isMapped ? (
          <small className="gamut-note">
            {conversion?.gamutMapped
              ? `Package mapped this conversion using ${conversion.gamutMapping}.`
              : `The sRGB preview uses ${preview.gamutMapping ?? "the package gamut mapping"}; the displayed value is unchanged.`}
          </small>
        ) : null}
      </div>
      <CopyButton value={valueText} label={label} />
    </li>
  );
}

export function ColorResultList({ items, emptyMessage }: {
  items: readonly { label: string; color: ColorValue; conversion?: ColorConversionResult }[];
  emptyMessage: string;
}) {
  if (items.length === 0) return <p className="tool-empty" role="status">{emptyMessage}</p>;
  return (
    <ul className="color-results">
      {items.map((item, index) => (
        <ColorResult key={`${item.label}-${index}`} {...item} />
      ))}
    </ul>
  );
}

export function ToolHeading({ id, eyebrow, title, description }: { id: string; eyebrow: string; title: string; description: string }) {
  return (
    <header className="color-tool__header">
      <p className="eyebrow">{eyebrow}</p>
      <h1 id={id}>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function ToolFeedback({ message, error = false }: { message?: string; error?: boolean }) {
  if (!message) return null;
  return <p className={error ? "tool-error" : "tool-feedback"} role={error ? "alert" : "status"}>{message}</p>;
}
