import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocumentationNav } from "@/components/documentation-nav";
import { readPackageExample } from "@/lib/openapi-source";

const sections = [
  { id: "install", label: "Install and requirements" },
  { id: "formats", label: "Formats and conversion" },
  { id: "operations", label: "Generation and manipulation" },
  { id: "palettes-scales", label: "Palettes and scales" },
  { id: "analysis", label: "Contrast and analysis" },
  { id: "tokens", label: "Design tokens" },
  { id: "errors", label: "Errors" },
  { id: "react", label: "React integration" }
] as const;

export function PackageGuide() {
  const examples = {
    gettingStarted: readPackageExample("getting-started.ts"),
    operations: readPackageExample("operations.ts"),
    errors: readPackageExample("errors.ts"),
    tokens: readPackageExample("tokens.ts"),
    react: readPackageExample("react-example.tsx")
  };

  return (
    <div className="documentation-layout">
      <DocumentationNav active="package" anchors={sections} />
      <article className="documentation-content">
        <header className="documentation-header">
          <p className="eyebrow">PACKAGE GUIDE <span className="status-tag">chromaforge@1.0.1</span></p>
          <h1>Color operations for TypeScript and JavaScript</h1>
          <p>ChromaForge is a deterministic color engine. Its ESM package provides color validation, conversion, generation, manipulation, contrast, analysis, and token serialization without importing the Fastify server.</p>
          <p>Package examples below use the public named exports from <code>chromaforge@1.0.1</code>. The API playground makes network requests; package operations run in the application that imports the library.</p>
        </header>

        <section className="documentation-section" id="install" aria-labelledby="install-title">
          <h2 id="install-title">Install and requirements</h2>
          <CodeBlock code="npm install chromaforge" language="shell" label="npm install command" />
          <ul>
            <li>The package is ESM-only and exposes its package entry through the <code>import</code> condition.</li>
            <li>The package declares <code>node &gt;=22.12.0</code>. The project documents maintained Node.js 22.x (22.12.0 or newer) and 24.x as its tested release targets.</li>
            <li>TypeScript declarations are included. The package does not declare a minimum TypeScript peer version; its consumer type checks were verified with TypeScript 5.9.3 and NodeNext module resolution. This website also typechecks its examples against the published package.</li>
            <li>The published package had a browser smoke test in Chrome 154 on Windows. Other browser engines have not been independently verified by the package project.</li>
          </ul>
          <h3>First import</h3>
          <CodeBlock code={examples.gettingStarted} language="typescript" label="getting started TypeScript example" />
          <p><code>convertColor</code> returns the normalized input, converted output, and gamut-mapping metadata. A string seed makes <code>generateColors</code> reproducible and identifies its algorithm in the result.</p>
        </section>

        <section className="documentation-section" id="formats" aria-labelledby="formats-title">
          <h2 id="formats-title">Formats, validation, and conversion</h2>
          <p>The package supports six tagged formats: HEX, RGB, HSL, HSV, OKLab, and OKLCH. HEX accepts six- or eight-digit values. Structured formats accept an optional alpha value from 0 through 1. Use <code>validateColorValue</code> to validate a known format, <code>validateColorInput</code> for a tagged value, and <code>convertColor</code> for conversion.</p>
          <p>Same-format conversion performs canonical normalization. Public HSL/HSV values use two decimal places; OKLab/OKLCH values and structured alpha use four. RGB channels are integer sRGB values and HEX output is canonical lowercase. Calculations retain full precision until the documented output is produced.</p>
          <p>sRGB-bounded outputs use the package&apos;s CSS Color 4 local-MINDE mapping when needed. Every conversion returns <code>gamutMapped</code>; mapped results include <code>gamutMapping: &quot;css-color-4-local-minde&quot;</code>.</p>
        </section>

        <section className="documentation-section" id="operations" aria-labelledby="operations-title">
          <h2 id="operations-title">Generation and manipulation</h2>
          <p><code>generateColors</code> returns 1–1000 OKLCH values. Optional constraints cover lightness [0, 1], chroma [0, 0.4], and hue [0, 360]. Seeded generation uses <code>mulberry32-v1</code>; unseeded generation uses <code>Math.random</code>.</p>
          <p>Manipulation exports include <code>rotateHue</code>, <code>adjustLightness</code>, <code>adjustChroma</code>, <code>adjustSaturation</code>, <code>adjustAlpha</code>, <code>grayscaleColor</code>, and <code>invertColor</code>. Hue/lightness/chroma/saturation adjustments operate in OKLCH. Saturation adjustment is a relative chroma delta; for example, 0.5 adds 50% chroma.</p>
          <p><code>mixColors</code> interpolates in premultiplied OKLab by default or encoded sRGB when requested. <code>compositeColors</code> is a separate source-over operation using encoded sRGB. A translucent background needs an opaque canvas.</p>
          <CodeBlock code={examples.operations} language="typescript" label="generation palette scale and manipulation TypeScript example" />
        </section>

        <section className="documentation-section" id="palettes-scales" aria-labelledby="palette-title">
          <h2 id="palette-title">Palettes and scales</h2>
          <p><code>generateHslPalette</code> supports complementary, analogous, triadic, tetradic, split-complementary, and monochromatic strategies. A custom count from 2 to 12 is available for analogous palettes only. <code>generateShades</code>, <code>generateTints</code>, and <code>generateTones</code> return ordered conversions.</p>
          <p><code>generateOklchScale</code> samples 2–10 ordered stops across 2–101 evenly spaced positions. Stops must span positions 0 to 1, have strictly increasing positions, non-decreasing lightness, and equal alpha. Scale results include gamut metadata.</p>
        </section>

        <section className="documentation-section" id="analysis" aria-labelledby="analysis-title">
          <h2 id="analysis-title">Contrast and color analysis</h2>
          <p><code>analyzeContrast</code> reports a ratio, criterion, threshold, raw ratio, effective colors, and compositing model. Text evaluation supports WCAG 2.2 SC 1.4.3 normal and large text; contextual non-text evaluation supports SC 1.4.11 and requires a named object or boundary. Transparent backgrounds require an opaque canvas. A pair result is not a claim of whole-interface accessibility.</p>
          <p><code>analyzeColor</code> provides relative luminance and the package&apos;s light/dark heuristic, plus hue/chroma or HSL/HSV saturation where defined. It requires an opaque color. <code>deltaEOK</code> returns Euclidean distance in OKLab; it has no universal similarity threshold.</p>
        </section>

        <section className="documentation-section" id="tokens" aria-labelledby="tokens-title">
          <h2 id="tokens-title">Design tokens</h2>
          <p>Token helpers validate names against <code>^[a-z][a-z0-9-]*$</code> and normalize colors before serializing. Supported package exports include versioned design-token JSON, CSS variables, JavaScript, TypeScript, SCSS, Tailwind color data, and object/document creation. Tailwind output is plain data and does not depend on a Tailwind package version.</p>
          <CodeBlock code={examples.tokens} language="typescript" label="design token TypeScript example" />
        </section>

        <section className="documentation-section" id="errors" aria-labelledby="errors-title">
          <h2 id="errors-title">Error handling</h2>
          <p>Validation and operations can throw <code>InvalidColorError</code> with a stable <code>code</code> and structured <code>issues</code>; invalid operation parameters can throw <code>InvalidRequestError</code>. Catch unknown values as <code>unknown</code>, handle package errors explicitly, and let unexpected programming errors remain visible to your own error boundary.</p>
          <CodeBlock code={examples.errors} language="typescript" label="package error handling TypeScript example" />
        </section>

        <section className="documentation-section" id="react" aria-labelledby="react-title">
          <h2 id="react-title">React integration</h2>
          <p>The following client-side component uses named package imports for local validation and conversion. The example source is included in this website&apos;s strict TypeScript build. It does not establish support for a specific server-rendering framework or every browser engine.</p>
          <CodeBlock code={examples.react} language="typescript" label="React integration example" />
        </section>

        <p className="documentation-note">For the network API contract and request examples, see <Link href="/docs/api/">the API reference</Link>. The API&apos;s <code>/v1</code> routes are marked pre-release.</p>
      </article>
    </div>
  );
}
