import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeControl } from "@/components/theme-control";
import { primaryLinks } from "@/lib/site-navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark" href="/" aria-label="ChromaForge home">
          <BrandMark />
          <span>ChromaForge</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <ThemeControl />
          <details className="mobile-menu">
            <summary aria-label="Navigation menu">Menu</summary>
            <nav aria-label="Mobile navigation">
              {primaryLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
