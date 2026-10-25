import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/phase-placeholder";

export const metadata: Metadata = {
  title: "API playground",
  description: "Explore the documented ChromaForge REST API operations."
};

export default function PlaygroundPage() {
  return (
    <div className="single-page-shell">
      <PhasePlaceholder
        description="Explore the documented HTTP operations and review request and response examples."
        href="/docs/api"
        label="API playground"
        phase={16}
        kind="API playground"
      />
      <p className="release-note"><strong>API status:</strong> The existing `/v1` contract is pre-release.</p>
    </div>
  );
}
