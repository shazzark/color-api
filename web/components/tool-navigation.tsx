import Link from "next/link";
import { toolRoutes } from "@/lib/site-navigation";

export function ToolNavigation() {
  return (
    <nav className="tool-navigation" aria-label="Color tools">
      <p className="eyebrow">Tools</p>
      {toolRoutes.map((tool) => (
        <Link key={tool.href} href={tool.href}>
          <span>{tool.label}</span>
          <span className="tool-navigation__phase">P{tool.phase}</span>
        </Link>
      ))}
    </nav>
  );
}
