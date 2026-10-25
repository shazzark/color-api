import Link from "next/link";
import { toolRoutes } from "@/lib/site-navigation";

export function ToolIndex() {
  return (
    <ul className="tool-index">
      {toolRoutes.map((tool, index) => (
        <li key={tool.href}>
          <Link href={tool.href}>
            <span className="tool-index__number">{String(index + 1).padStart(2, "0")}</span>
            <span className="tool-index__copy">
              <span className="tool-index__title">{tool.label}</span>
              <span className="tool-index__description">{tool.description}</span>
            </span>
            <span className="tool-index__phase">Phase {tool.phase}</span>
            <span className="tool-index__arrow" aria-hidden="true">↗</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
