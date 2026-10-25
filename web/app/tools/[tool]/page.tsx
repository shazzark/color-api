import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhasePlaceholder } from "@/components/phase-placeholder";
import { toolRoutes } from "@/lib/site-navigation";
import { ColorConverter } from "@/features/convert/color-converter";
import { ColorGenerator } from "@/features/generate/color-generator";
import { ColorManipulator } from "@/features/manipulate/color-manipulator";
import { PaletteGenerator } from "@/features/palettes/palette-generator";
import { ColorScaleGenerator } from "@/features/scales/color-scale-generator";

interface ToolPageProps {
  params: Promise<{ tool: string }>;
}

function getTool(tool: string) {
  return toolRoutes.find((route) => route.href === `/tools/${tool}`);
}

export function generateStaticParams() {
  return toolRoutes.map((route) => ({ tool: route.href.split("/").at(-1) ?? "" }));
}

function getToolComponent(tool: string) {
  switch (tool) {
    case "convert": return <ColorConverter />;
    case "generate": return <ColorGenerator />;
    case "manipulate": return <ColorManipulator />;
    case "palettes": return <PaletteGenerator />;
    case "scales": return <ColorScaleGenerator />;
    default: return undefined;
  }
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

  const toolComponent = getToolComponent(tool);
  if (route.available && toolComponent) return toolComponent;

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
