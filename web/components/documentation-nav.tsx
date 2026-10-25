import Link from "next/link";

export function DocumentationNav({ active, anchors = [] }: { active: "package" | "api"; anchors?: readonly { id: string; label: string }[] }) {
  return (
    <nav className="documentation-nav" aria-label="Documentation">
      <h2>Documentation</h2>
      <Link href="/docs/package" aria-current={active === "package" ? "page" : undefined}>npm package</Link>
      <Link href="/docs/api" aria-current={active === "api" ? "page" : undefined}>API reference</Link>
      {anchors.length > 0 ? (
        <details className="documentation-nav__contents">
          <summary>On this page</summary>
          <ul>{anchors.map((anchor) => <li key={anchor.id}><a href={`#${anchor.id}`}>{anchor.label}</a></li>)}</ul>
        </details>
      ) : null}
    </nav>
  );
}
