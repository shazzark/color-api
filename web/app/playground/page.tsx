import type { Metadata } from "next";
import { ApiPlayground } from "@/features/playground/api-playground";
import { apiOriginConfiguration } from "@/lib/api-origin";
import { getDocumentedLimits, getPlaygroundOperations } from "@/lib/openapi-source";

export const metadata: Metadata = {
  title: "API playground",
  description: "Explore the documented ChromaForge REST API operations."
};

export default function PlaygroundPage() {
  const operations = getPlaygroundOperations();
  const limits = getDocumentedLimits();
  return (
    <ApiPlayground operations={operations} apiOrigin={apiOriginConfiguration} maxRequestBytes={limits.defaultBodyBytes} />
  );
}
