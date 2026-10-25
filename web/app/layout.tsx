import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "ChromaForge — Color operations for developers",
    template: "%s | ChromaForge"
  },
  description: "A deterministic color engine, reusable JavaScript package, and versioned REST API.",
  applicationName: "ChromaForge",
  openGraph: {
    type: "website",
    siteName: "ChromaForge",
    title: "ChromaForge — Color operations for developers",
    description: "A deterministic color engine, reusable JavaScript package, and versioned REST API."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#111512" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content" className="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
