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
          <a href="https://color-api-9qdz.onrender.com/docs">API documentation</a>
          <Link href="/playground">API playground <span className="status-tag">pre-release API</span></Link>
        </nav>
        <p className="site-footer__note">Five local color tools are available. The API playground and documentation remain on their planned routes.</p>
      </div>
    </footer>
  );
}
