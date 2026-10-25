import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhasePlaceholder } from "@/components/phase-placeholder";
import { ApiReference } from "@/features/docs/api-reference";
import { PackageGuide } from "@/features/docs/package-guide";
import { documentationRoutes } from "@/lib/site-navigation";

interface DocumentationPageProps {
  params: Promise<{ section: string }>;
}

function getSection(section: string) {
  return documentationRoutes.find((route) => route.href === `/docs/${section}`);
}

export function generateStaticParams() {
  return documentationRoutes.map((route) => ({ section: route.href.split("/").at(-1) ?? "" }));
}

export async function generateMetadata({ params }: DocumentationPageProps): Promise<Metadata> {
  const { section } = await params;
  const route = getSection(section);
  if (!route) return {};
  return { title: route.label, description: route.description };
}

export default async function DocumentationPage({ params }: DocumentationPageProps) {
  const { section } = await params;
  const route = getSection(section);
  if (!route) notFound();

  if (section === "package") return <PackageGuide />;
  if (section === "api") return <ApiReference />;

  return (
    <PhasePlaceholder
      description={route.description}
      href="/docs/api"
      label={route.label}
      phase={route.phase}
      kind="Documentation"
    />
  );
}
