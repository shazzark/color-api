"use client";

import { useState, type ChangeEvent } from "react";
import { convertColor, validateColorValue } from "chromaforge";

export function ColorReadout() {
  const [input, setInput] = useState("#3498db");
  const [preview, setPreview] = useState("#3498db");
  const [message, setMessage] = useState("");

  function updateColor(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    setInput(value);
    try {
      const color = validateColorValue("hex", value);
      const result = convertColor(color, "oklch");
      const previewResult = convertColor(color, "hex");
      if (previewResult.output.format === "hex") setPreview(previewResult.output.value);
      setMessage(`OKLCH: ${JSON.stringify(result.output.value)}`);
    } catch {
      setMessage("Enter a valid six- or eight-digit HEX color.");
    }
  }

  return (
    <label>
      Color in HEX
      <input value={input} onChange={updateColor} />
      <span aria-live="polite">{message}</span>
      <span aria-hidden="true" style={{ display: "block", width: "3rem", height: "3rem", backgroundColor: preview }} />
    </label>
  );
}
