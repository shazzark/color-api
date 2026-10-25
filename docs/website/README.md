# ChromaForge website cycle

**Status: Phases 12–15 complete; Phase 16 implementation is complete and awaits exact-origin CORS verification; Phase 17 awaits authorization.**

This is the Phase 12 planning handoff and implementation record for the
user-facing ChromaForge website. It does not change the released package/API
scope. Phases 13–15 are complete; Phase 16's documentation and playground
implementation is complete, with exact-origin CORS and live browser/API
verification pending selection of the production website origin. Phase 17
remains proposed. The website consumes the
existing `chromaforge@1.0.1` package and public API; it must not reimplement
color math.

## Planning documents

- [MVP scope](mvp-scope.md): what the first website release includes and defers.
- [Website PRD](prd.md): product behavior, journeys, and acceptance criteria.
- [Technical requirements](trd.md): testable technical, accessibility, security,
  deployment, and performance requirements.
- [Capability map](capability-map.md): requested website features mapped to
  existing package exports and API operations.
- [App flow](app-flow.md): navigation and core user journeys.
- [Architecture](architecture.md): repository, framework, package/API, and
  deployment boundaries.
- [Design system](design-system.md): approved visual direction and candidate tokens,
  components, responsive behavior, and accessibility.
- [Implementation plan](implementation-plan.md): proposed phases and gates.
- [Task checklist](tasks.md): phase-level work, verification, risks, and
  definitions of done.
- [Deployment runbook](deployment-runbook.md): proposed Phase 17 Vercel and
  Render settings, GitHub push gates, production smoke checks, and rollback.

## Approved decisions and remaining selection

Approved: the MVP scope and user journeys; isolated `web/` app in this repo;
Next.js App Router, TypeScript, Tailwind, independent manifest/lockfile; public
package `chromaforge@1.0.1` for local tools; existing `/v1` API marked
pre-release; no database/auth; Vercel as initial host; system theme with a
persistent manual override; Swiss/International + Typography-Led direction
with restrained playful accents; Geist Sans/Mono candidates with fallbacks;
temporary text wordmark; static export only if compatible.

The production domain is not selected. Exact-origin API CORS configuration
and browser verification remain Phase 16 work; deployment remains Phase 17
work. API CORS was not changed during Phases 13 or 14.

Phase 13 delivered the responsive static shell. Phase 14 added package-backed
converter, generator, manipulation, palette, and scale tools while retaining
static export. Phase 15 added package-backed contrast, analysis, and token
tools. Phase 16 adds package documentation, a complete OpenAPI reference, and
a fixed-origin API playground. The playground is tested with mocked browser
requests; live browser/API CORS verification depends on the selected website
domain. See
the [Phase 15 checklist](tasks.md#phase-15--contrast-analysis-and-tokens-complete)
for verification results and limitations.

## Evidence and proposals

Existing facts are drawn from the repository's `prd.md`, `architecture.md`,
`task.md`, package exports, API routes, OpenAPI contract, and deployment notes.
The approved website scope is separate from the completed package/API
acceptance criteria. See [the current project PRD](../../prd.md),
[architecture](../../architecture.md), and [phase history](../../task.md) for
the completed package/API cycle.
