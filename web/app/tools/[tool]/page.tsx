import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhasePlaceholder } from "@/components/phase-placeholder";
import { toolRoutes } from "@/lib/site-navigation";

interface ToolPageProps {
  params: Promise<{ tool: string }>;
}

function getTool(tool: string) {
  return toolRoutes.find((route) => route.href === `/tools/${tool}`);
}

export function generateStaticParams() {
  return toolRoutes.map((route) => ({ tool: route.href.split("/").at(-1) ?? "" }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { tool } = await params;
  const route = getTool(tool);
  if (!route) return {};
  return { title: route.label, description: route.description };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool } = await params;
  const route = getTool(tool);
  if (!route) notFound();

  return (
    <PhasePlaceholder
      description={route.description}
      href="/tools/convert"
      label={route.label}
      phase={route.phase}
      kind="Tool workspace"
    />
  );
}
