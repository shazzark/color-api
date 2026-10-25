import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__brand">ChromaForge</p>
          <p>Color operations, built on deterministic math.</p>
        </div>
        <nav aria-label="Developer resources">
          <a href="https://www.npmjs.com/package/chromaforge">npm package</a>
          <Link href="/docs/api/">API reference</Link>
          <Link href="/playground">API playground <span className="status-tag">pre-release API</span></Link>
        </nav>
        <p className="site-footer__note">Eight local color tools, package documentation, API reference, and a pre-release API playground are available.</p>
      </div>
    </footer>
  );
}
