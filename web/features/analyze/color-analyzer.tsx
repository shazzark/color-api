"use client";

import { analyzeColor, deltaEOK, type ColorValue } from "chromaforge";
import { useState, type FormEvent } from "react";
import { ColorInput } from "@/features/shared/color-input";
import { ColorResult, ToolFeedback, ToolHeading } from "@/features/shared/color-results";
import { FormActions, SubmitButton } from "@/features/shared/tool-controls";

const initialColor: ColorValue = { format: "hex", value: "#3456d1" };
const initialComparison: ColorValue = { format: "hex", value: "#f27b68" };
type ColorAnalysis = ReturnType<typeof analyzeColor>;

export function ColorAnalyzer() {
  const [color, setColor] = useState<ColorValue | undefined>(initialColor);
  const [comparison, setComparison] = useState<ColorValue | undefined>(initialComparison);
  const [compareColors, setCompareColors] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [analysis, setAnalysis] = useState<ColorAnalysis>();
  const [difference, setDifference] = useState<number>();
  const [error, setError] = useState("");

  function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysis(undefined);
    setDifference(undefined);
    try {
      if (!color) throw new Error("Enter a valid color before analysis.");
      const result = analyzeColor(color);
      let distance: number | undefined;
      if (compareColors) {
        if (!comparison) throw new Error("Enter a valid comparison color.");
        analyzeColor(comparison);
        distance = deltaEOK(color, comparison);
      }
      setAnalysis(result);
      if (distance !== undefined) setDifference(distance);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The package could not analyze this color.");
    }
  }

  function reset() {
    setColor(initialColor);
    setComparison(initialComparison);
    setCompareColors(false);
    setResetKey((value) => value + 1);
    setAnalysis(undefined);
    setDifference(undefined);
    setError("");
  }

  return (
    <section className="color-tool" aria-labelledby="analyzer-title">
      <ToolHeading
        id="analyzer-title"
        eyebrow="PACKAGE TOOL · LOCAL CALCULATION"
        title="Color analyzer"
        description="Inspect the properties returned by ChromaForge’s color analysis. Metrics and classifications come from the package; deltaEOK is a distance value without a universal pass/fail threshold."
      />
      <div className="color-tool__grid">
        <form className="tool-panel" noValidate onSubmit={inspect}>
          <h2>Color input</h2>
          <ColorInput key={`analysis-${resetKey}`} id="analysis-color" label="Color to analyze" initialColor={initialColor} onChange={(value) => { setColor(value); setAnalysis(undefined); setDifference(undefined); }} />
          <label className="tool-check" htmlFor="analysis-compare-colors">
            <input id="analysis-compare-colors" type="checkbox" checked={compareColors} onChange={(event) => { setCompareColors(event.target.checked); setDifference(undefined); setAnalysis(undefined); }} />
            <span>Compare a second color with deltaEOK</span>
          </label>
          {compareColors ? <ColorInput key={`comparison-${resetKey}`} id="analysis-comparison" label="Comparison color" initialColor={initialComparison} onChange={(value) => { setComparison(value); setAnalysis(undefined); setDifference(undefined); }} /> : null}
          <p className="tool-help">Color analysis requires an opaque input. Remove transparency or set alpha to 1 before submitting.</p>
          <FormActions>
            <SubmitButton>Analyze color</SubmitButton>
            <button className="tool-button tool-button--quiet" type="button" onClick={reset}>Reset</button>
          </FormActions>
          <ToolFeedback message={error} error />
        </form>

        <section className="tool-panel" aria-labelledby="analysis-results-title">
          <h2 id="analysis-results-title">Package analysis</h2>
          {analysis ? (
            <>
              <ul className="color-results">
                <ColorResult label="Analyzed color" color={analysis.color} />
              </ul>
              <dl className="metric-list">
                <div><dt>Relative luminance</dt><dd>{analysis.relativeLuminance.toFixed(6)}</dd></div>
                <div><dt>Package light/dark classification</dt><dd>{analysis.isLight ? "Light" : analysis.isDark ? "Dark" : "Not classified"}</dd></div>
                {analysis.hue !== undefined ? <div><dt>OKLCH hue</dt><dd>{analysis.hue.toFixed(4)}°</dd></div> : null}
                {analysis.chroma !== undefined ? <div><dt>OKLCH chroma</dt><dd>{analysis.chroma.toFixed(6)}</dd></div> : null}
                {analysis.saturation !== undefined ? <div><dt>Input-format saturation</dt><dd>{analysis.saturation.toFixed(2)}%</dd></div> : null}
                {difference !== undefined ? <div><dt>deltaEOK distance</dt><dd>{difference.toFixed(6)}</dd></div> : null}
              </dl>
              <p className="tool-inline-note">The package classifies lightness using its relative-luminance rule. Hue and chroma are package-derived OKLCH values; saturation is returned only for HSL/HSV input. Achromatic colors may not include hue, chroma, or saturation.</p>
              {difference !== undefined ? <p className="tool-inline-note">deltaEOK measures distance in OKLab. No universal threshold is applied to call two colors similar or different.</p> : null}
            </>
          ) : <p className="tool-empty" role="status">Analyze a valid opaque color to inspect package-provided metrics.</p>}
        </section>
      </div>
    </section>
  );
}
