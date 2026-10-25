export interface SiteLink {
  href: string;
  label: string;
}

export interface ToolRoute extends SiteLink {
  description: string;
  phase: 14 | 15;
  available: boolean;
}

export interface DocumentationRoute extends SiteLink {
  description: string;
  phase: 16;
}

export const primaryLinks: SiteLink[] = [
  { href: "/", label: "Home" },
  { href: "/tools/convert", label: "Tools" },
  { href: "/playground", label: "API playground" },
  { href: "/docs/package", label: "Docs" }
];

export const toolRoutes: ToolRoute[] = [
  { href: "/tools/convert", label: "Convert", description: "Move between the supported color formats.", phase: 14, available: true },
  { href: "/tools/generate", label: "Generate", description: "Create seeded or unseeded OKLCH colors.", phase: 14, available: true },
  { href: "/tools/manipulate", label: "Manipulate", description: "Adjust, mix, or composite colors.", phase: 14, available: true },
  { href: "/tools/palettes", label: "Palettes", description: "Explore supported HSL harmony and variant sets.", phase: 14, available: true },
  { href: "/tools/scales", label: "Scales", description: "Build a scale from OKLCH stops.", phase: 14, available: true },
  { href: "/tools/contrast", label: "Contrast", description: "Evaluate one color pair against a selected WCAG criterion.", phase: 15, available: true },
  { href: "/tools/analyze", label: "Analyze", description: "Inspect the package's documented color metrics.", phase: 15, available: true },
  { href: "/tools/tokens", label: "Design tokens", description: "Serialize named colors in supported token formats.", phase: 15, available: true }
];

export const documentationRoutes: DocumentationRoute[] = [
  { href: "/docs/package", label: "npm package", description: "Installation and JavaScript/TypeScript guidance.", phase: 16 },
  { href: "/docs/api", label: "API reference", description: "The documented HTTP operations and examples.", phase: 16 }
];

export function toolRouteFromHref(href: string): ToolRoute | undefined {
  return toolRoutes.find((route) => route.href === href);
}

export function documentationRouteFromHref(href: string): DocumentationRoute | undefined {
  return documentationRoutes.find((route) => route.href === href);
}
