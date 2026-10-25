import Link from "next/link";
import { ToolIndex } from "@/components/tool-index";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> A color engine for the web</p>
          <h1 id="hero-title">Color operations, built on <em>deterministic math.</em></h1>
          <p className="hero-description">
            ChromaForge brings one color engine to a reusable JavaScript package and a versioned REST API. Inputs, assumptions, and outputs stay explicit.
          </p>
          <div className="hero-actions flex flex-wrap items-center gap-3">
            <Link className="button button--primary" href="/tools/convert">Explore the tool routes <span aria-hidden="true">↗</span></Link>
            <a className="button button--quiet" href="https://www.npmjs.com/package/chromaforge">View the npm package <span aria-hidden="true">↗</span></a>
          </div>
          <p className="hero-meta">Explore the published color engine in your browser. Local tools use the package and expose its documented inputs and results.</p>
        </div>
        <div className="hero-visual" role="group" aria-labelledby="hero-visual-caption">
          <div className="hero-visual__topline">
            <span>CHROMAFORGE / SYSTEMS</span>
            <span>01—02</span>
          </div>
          <div className="swatch-stack" aria-hidden="true">
            <span className="swatch swatch--blue" />
            <span className="swatch swatch--signal" />
            <span className="swatch swatch--coral" />
            <span className="swatch swatch--ink" />
          </div>
          <div className="engine-connector" aria-hidden="true"><span /><span /><span /></div>
          <div className="surface-labels">
            <div><span>PACKAGE</span><strong>JavaScript / TypeScript</strong></div>
            <div><span>API</span><strong>Versioned HTTP</strong></div>
          </div>
          <div className="hero-visual__caption" id="hero-visual-caption">
            <span className="brand-mark brand-mark--small" aria-hidden="true"><span /><span /><span /></span>
            <span>One engine. Two developer surfaces.</span>
          </div>
        </div>
      </section>

      <section className="tool-section" aria-labelledby="tools-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE WORKBENCH</p>
            <h2 id="tools-title">Start with a color task.</h2>
          </div>
          <p>Available tools run the published package in your browser. Other tool routes show their planned phase.</p>
        </div>
        <ToolIndex />
      </section>

      <section className="developer-section" aria-labelledby="developer-title">
        <div className="developer-section__copy">
          <p className="eyebrow">FOR BUILDERS</p>
          <h2 id="developer-title">Use the engine where your work happens.</h2>
          <p>Install the ESM package for application code, or read the API reference for the existing HTTP contract.</p>
        </div>
        <div className="install-panel">
          <div className="install-panel__bar"><span>TERMINAL</span><span>npm</span></div>
          <pre><code>npm install chromaforge</code></pre>
          <div className="install-panel__links">
            <a href="https://www.npmjs.com/package/chromaforge">Package details <span aria-hidden="true">↗</span></a>
            <a href="https://color-api-9qdz.onrender.com/docs">API reference <span aria-hidden="true">↗</span></a>
          </div>
          <p className="api-status"><span className="status-indicator" aria-hidden="true" /> The public API `/v1` contract is pre-release.</p>
        </div>
      </section>
    </div>
  );
}
