"use client";

import {
  analyzeContrast,
  suggestContrastingColors,
  type ColorValue,
  type ContrastCriterion,
  type ContrastResult,
  type TextSize
} from "chromaforge";
import { useState, type FormEvent } from "react";
import { ColorInput } from "@/features/shared/color-input";
import { colorPreviewHex } from "@/features/shared/color-format";
import { ColorResult, ToolFeedback, ToolHeading } from "@/features/shared/color-results";
import { FormActions, SelectField, SubmitButton, TextField } from "@/features/shared/tool-controls";

const initialForeground: ColorValue = { format: "hex", value: "#18201a" };
const initialBackground: ColorValue = { format: "hex", value: "#f7f8f5" };
const initialCanvas: ColorValue = { format: "hex", value: "#ffffff" };

export function ContrastChecker() {
  const [foreground, setForeground] = useState<ColorValue | undefined>(initialForeground);
  const [background, setBackground] = useState<ColorValue | undefined>(initialBackground);
  const [canvas, setCanvas] = useState<ColorValue | undefined>(initialCanvas);
  const [withCanvas, setWithCanvas] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [criterion, setCriterion] = useState<ContrastCriterion>("wcag-2.2-1.4.3");
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<ContrastResult>();
  const [suggestions, setSuggestions] = useState<ReturnType<typeof suggestContrastingColors>>();
  const [error, setError] = useState("");

  function evaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(undefined);
    setSuggestions(undefined);
    try {
      if (!foreground || !background) throw new Error("Correct both colors before evaluating contrast.");
      const options = {
        criterion,
        ...(criterion === "wcag-2.2-1.4.3" ? { textSize } : {}),
        ...(context.trim() === "" ? {} : { context }),
        ...(withCanvas && canvas ? { canvas } : {})
      };
      setResult(analyzeContrast(foreground, background, options));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The package could not evaluate this color pair.");
    }
  }

  function findSuggestions() {
    setSuggestions(undefined);
    try {
      if (!foreground || !background) throw new Error("Correct both colors before requesting suggestions.");
      setSuggestions(suggestContrastingColors(foreground, background, {
        criterion,
        ...(criterion === "wcag-2.2-1.4.3" ? { textSize } : {}),
        ...(context.trim() === "" ? {} : { context }),
        ...(withCanvas && canvas ? { canvas } : {})
      }));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The package could not suggest a foreground color.");
    }
  }

  function reset() {
    setForeground(initialForeground);
    setBackground(initialBackground);
    setCanvas(initialCanvas);
    setWithCanvas(false);
    setResetKey((value) => value + 1);
    setCriterion("wcag-2.2-1.4.3");
    setTextSize("normal");
    setContext("");
    setResult(undefined);
    setSuggestions(undefined);
    setError("");
  }

  const foregroundPreview = foreground ? colorPreviewHex(foreground).hex : "transparent";
  const backgroundPreview = background ? colorPreviewHex(background).hex : "transparent";
  const canvasPreview = canvas ? colorPreviewHex(canvas).hex : "var(--cf-surface)";

  return (
    <section className="color-tool" aria-labelledby="contrast-title">
      <ToolHeading
        id="contrast-title"
        eyebrow="PACKAGE TOOL · LOCAL CALCULATION"
        title="Contrast checker"
        description="Measure one foreground/background pair with ChromaForge’s documented WCAG 2.2 criteria. Transparent colors follow the package’s encoded-sRGB source-over compositing rules."
      />
      <div className="color-tool__grid">
        <form className="tool-panel" noValidate onSubmit={evaluate}>
          <h2>Color pair and criterion</h2>
          <ColorInput key={`foreground-${resetKey}`} id="contrast-foreground" label="Foreground color" initialColor={initialForeground} onChange={(color) => { setForeground(color); setResult(undefined); setSuggestions(undefined); }} />
          <ColorInput key={`background-${resetKey}`} id="contrast-background" label="Background color" initialColor={initialBackground} onChange={(color) => { setBackground(color); setResult(undefined); setSuggestions(undefined); }} />
          <SelectField
            id="contrast-criterion"
            label="WCAG 2.2 criterion"
            value={criterion}
            options={[
              { value: "wcag-2.2-1.4.3", label: "Text contrast · SC 1.4.3" },
              { value: "wcag-2.2-1.4.11", label: "Non-text contrast · SC 1.4.11" }
            ]}
            onChange={(value) => {
              if (value === "wcag-2.2-1.4.3" || value === "wcag-2.2-1.4.11") {
                setCriterion(value);
                setResult(undefined);
                setSuggestions(undefined);
              }
            }}
          />
          {criterion === "wcag-2.2-1.4.3" ? (
            <SelectField
              id="contrast-text-size"
              label="Text size category"
              value={textSize}
              options={[{ value: "normal", label: "Normal text · AA 4.5:1" }, { value: "large", label: "Large text · AA 3:1" }]}
              onChange={(value) => { if (value === "normal" || value === "large") { setTextSize(value); setResult(undefined); setSuggestions(undefined); } }}
              hint="Large text means at least 24 CSS px regular or about 18.67 CSS px bold."
            />
          ) : (
            <TextField id="contrast-context" label="Graphical object or boundary" value={context} onChange={(value) => { setContext(value); setResult(undefined); setSuggestions(undefined); }} hint="Required for the package’s non-text evaluation." />
          )}
          {criterion === "wcag-2.2-1.4.3" ? <TextField id="contrast-text-context" label="Usage context (optional)" value={context} onChange={(value) => { setContext(value); setResult(undefined); setSuggestions(undefined); }} hint="For example, body copy or a control label." /> : null}
          <label className="tool-check" htmlFor="contrast-use-canvas">
            <input id="contrast-use-canvas" type="checkbox" checked={withCanvas} onChange={(event) => { setWithCanvas(event.target.checked); if (event.target.checked) setCanvas(initialCanvas); setResult(undefined); setSuggestions(undefined); }} />
            <span>Provide an opaque canvas for a translucent background</span>
          </label>
          {withCanvas ? <ColorInput key={`canvas-${resetKey}`} id="contrast-canvas" label="Opaque canvas" initialColor={initialCanvas} onChange={(color) => { setCanvas(color); setResult(undefined); setSuggestions(undefined); }} /> : null}
          <FormActions>
            <SubmitButton>Evaluate pair</SubmitButton>
            <button className="tool-button tool-button--quiet" type="button" onClick={findSuggestions}>Find foreground suggestions</button>
            <button className="tool-button tool-button--quiet" type="button" onClick={reset}>Reset</button>
          </FormActions>
          <ToolFeedback message={error} error />
        </form>

        <div className="contrast-results">
          <section className="tool-panel" aria-labelledby="contrast-preview-title">
            <h2 id="contrast-preview-title">Pair preview</h2>
            <div className="contrast-sample__canvas" style={{ backgroundColor: withCanvas ? canvasPreview : "var(--cf-surface)" }}>
              <p className="contrast-sample__pair" style={{ color: foregroundPreview, backgroundColor: backgroundPreview }}>Sample text: Aa 123</p>
              <div
                className="contrast-sample__interface"
                role="img"
                aria-label="Example non-text interface boundary using the selected foreground and background colors."
                style={{ backgroundColor: backgroundPreview, color: foregroundPreview }}
              >
                <span className="contrast-sample__boundary" style={{ borderColor: foregroundPreview }} aria-hidden="true" />
                <span>Interface boundary</span>
              </div>
            </div>
            <div className="contrast-swatches" aria-label="Selected colors">
              <div><span className="contrast-swatch" style={{ backgroundColor: foregroundPreview }} aria-hidden="true" /><span>Foreground</span></div>
              <div><span className="contrast-swatch" style={{ backgroundColor: backgroundPreview }} aria-hidden="true" /><span>Background</span></div>
            </div>
          </section>

          <section className="tool-panel" aria-labelledby="contrast-result-title">
            <h2 id="contrast-result-title">Measured result</h2>
            {result ? (
              <>
                <p className={result.passesCriterion ? "tool-feedback" : "tool-error"} role="status">
                  {result.passesCriterion ? "Meets" : "Does not meet"} the selected {result.criterion} threshold of {result.threshold}:1.
                </p>
                <dl className="metric-list">
                  <div><dt>Contrast ratio</dt><dd>{result.contrastRatio}:1</dd></div>
                  <div><dt>Raw ratio used for threshold</dt><dd>{result.rawContrastRatio.toFixed(6)}:1</dd></div>
                  <div><dt>Evaluation scope</dt><dd>{result.criterion === "wcag-2.2-1.4.3" ? `${result.textSize} text` : result.context}</dd></div>
                  <div><dt>Compositing model</dt><dd>{result.compositing}</dd></div>
                </dl>
                {result.wcag ? (
                  <div className="wcag-matrix" aria-label="Pair-level WCAG 2.2 text results">
                    <div><strong>Text size</strong><strong>AA</strong><strong>AAA</strong></div>
                    <div><span>Normal</span><span>{result.wcag.normalText.aa ? "Pass" : "Below threshold"}</span><span>{result.wcag.normalText.aaa ? "Pass" : "Below threshold"}</span></div>
                    <div><span>Large</span><span>{result.wcag.largeText.aa ? "Pass" : "Below threshold"}</span><span>{result.wcag.largeText.aaa ? "Pass" : "Below threshold"}</span></div>
                  </div>
                ) : null}
                <ul className="color-results">
                  <ColorResult label="Effective foreground" color={result.effectiveForeground} />
                  <ColorResult label="Effective background" color={result.effectiveBackground} />
                </ul>
                <p className="tool-inline-note">This result applies only to this pair and the selected criterion/context. It does not establish that a component, page, or product is accessible.</p>
              </>
            ) : <p className="tool-empty" role="status">Evaluate a valid pair to see its ratio, selected threshold, and effective colors.</p>}
          </section>

          <section className="tool-panel" aria-labelledby="contrast-suggestions-title">
            <h2 id="contrast-suggestions-title">Package suggestions</h2>
            {suggestions ? suggestions.candidates.length > 0 ? (
              <>
                <p className="tool-inline-note">Suggested foreground values are measured against the same background and selected criterion. Suggestions do not certify broader interface accessibility.</p>
                <ul className="color-results">
                  {suggestions.candidates.map((candidate) => (
                    <ColorResult key={candidate.direction} label={`${candidate.direction} · ${candidate.contrastRatio.toFixed(2)}:1 · deltaEOK ${candidate.deltaEOK.toFixed(6)}`} color={candidate.color} />
                  ))}
                </ul>
              </>
            ) : <p className="tool-empty" role="status">The package found no candidate in either lightness direction for this selected target.</p> : (
              <p className="tool-empty" role="status">Request suggestions to see package-generated foreground candidates and their measured distances.</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
