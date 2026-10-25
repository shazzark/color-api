import Link from "next/link";

interface PhasePlaceholderProps {
  description: string;
  href: string;
  label: string;
  phase: number;
  kind: "Tool workspace" | "Documentation" | "API playground";
}

export function PhasePlaceholder({ description, href, label, phase, kind }: PhasePlaceholderProps) {
  return (
    <article className="phase-placeholder">
      <p className="eyebrow">{kind} <span className="status-tag">Phase {phase}</span></p>
      <h1>{label}</h1>
      <p className="phase-placeholder__description">{description}</p>
      <div className="phase-placeholder__notice" role="status">
        <span className="status-indicator" aria-hidden="true" />
        <p>This workspace is planned for Phase {phase}. Its interactive behavior is not available in this foundation phase.</p>
      </div>
      <Link className="text-link" href={href}>Browse the planned routes <span aria-hidden="true">→</span></Link>
    </article>
  );
}
