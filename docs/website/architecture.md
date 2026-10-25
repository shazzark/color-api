# ChromaForge website architecture

**Status: approved website boundary.** This does not change the current
package/API architecture.

## Recommendation

Add an isolated `web/` Next.js App Router application in the existing
repository. Give it its own package manifest, lockfile, configuration, scripts,
and test setup. Do not add npm workspaces or change root package dependencies,
build, publish, Fastify, or OpenAPI behavior.

This keeps planning, source contract, and website code review together while
separating installs and release lifecycles. The root package's explicit `files`
allow-list remains the npm artifact boundary. If an independent team, access
control, or release ownership emerges, move `web/` to a separate repository
without changing the published package/API contract.

| Option | Benefits | Costs/risks | Assessment |
|---|---|---|---|
| Isolated `web/` app in current repo | Shared issue/review context; one source for OpenAPI and docs; no root package/API rewrite; package tarball allow-list already isolates published files. | Repo contains independently deployable apps; root-level workflows need explicit web checks later. | **Recommended** with separate manifest/lock and no root workspace. |
| Separate website repo | Strong release/access separation; independent CI and deploy configuration. | Duplicated planning/context; OpenAPI and package docs must be versioned/fetched; coordination drift. | Use if independent ownership or access boundaries justify it. |
| Root npm workspace/monorepo | Unified dependency install and tooling. | Alters root install/build/CI and package release boundary without a current need. | Defer. |

## Runtime and module boundaries

```text
web/app (Next.js route composition; static content by default)
  ├── web/features/* (tool-specific UI + client orchestration)
  ├── web/components/* (small accessible shared UI)
  ├── npm chromaforge@1.0.1 (all local deterministic color operations)
  └── public API origin (explicit API playground requests only)

existing src/color/* → existing package build and Fastify API
```

- Use App Router layouts/pages as Server Components by default for static
  content. Put event handlers, tool state, clipboard, theme preference, and
  interactive editors in small Client Components.
- Import only public package exports, through the installed package name. Keep
  Fastify and Node server modules out of client bundles.
- Keep route composition under `web/app`, capability code near each feature
  under `web/features`, and shared controls/tokens under `web/components` and
  `web/styles` only when genuinely shared.
- Keep API transport as a small `web/lib/api-client` boundary, with operation
  allow-list/schema/examples generated or validated against OpenAPI.
- Use URL state only for non-sensitive, shareable state after an explicit
  privacy decision; keep ordinary inputs in feature state.

## Package and API execution model

- Converter, generation, manipulation, palette, scales, contrast, analysis,
  and token tools call `chromaforge@1.0.1` in the browser. They work without
  API connectivity.
- The playground makes direct browser requests to the existing API. API
  reference schema and examples are included from the checked-in OpenAPI
  artifact at build time; no runtime OpenAPI fetch is required.
- Direct fetch needs the website's exact HTTPS origin in API `CORS_ORIGINS`.
  No wildcard is allowed. The app does not require a proxy/BFF for MVP.
- The API is pre-release. Display this to users and avoid promises of stability
  or SLA until a separate API release decision is made.

## Rendering and deployment

The proposed site is mostly static documentation plus client-only tools and
client-to-API playground calls. Prefer Next.js static export if route and build
requirements remain compatible; it avoids a persistent website server and has
no website secrets. If a needed feature requires dynamic server behavior, make
that an explicit architecture review rather than silently adding a proxy.

No hosting provider or domain is selected. Deployment requirements are a static
HTTPS host, immutable asset delivery, route fallback/asset correctness,
website security headers, and an exact-origin API CORS entry. Keep the existing
Render API deployment independent. Preview origins must be explicitly
allow-listed or preview API calls disabled. Verify deployed tool use and
playground preflight/request behavior before launch.

## Technology references

The current official Next.js docs describe App Router layouts/pages as Server
Components by default and recommend Client Components for state, event handlers,
and browser APIs; static export is an available deployment mode. Tailwind's
official Next.js guide uses a PostCSS integration. Verify exact versions and
static-export constraints when implementation begins:

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying)
- [Tailwind CSS with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
