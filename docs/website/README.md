# ChromaForge website cycle

**Status: Phases 12–13 complete; Phases 14–17 await approval.**

This is the Phase 12 planning handoff and Phase 13 implementation record for a
user-facing ChromaForge website. It does not change the released package/API scope or mark future website delivery
phases complete. Phase 13 was the only implementation phase authorized in
this cycle, and its foundation checkpoint is complete. The website should
consume the existing `chromaforge@1.0.1` package and public API; it must not
reimplement color math.

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

## Approved decisions and remaining selection

Approved: the MVP scope and user journeys; isolated `web/` app in this repo;
Next.js App Router, TypeScript, Tailwind, independent manifest/lockfile; public
package `chromaforge@1.0.1` for local tools; existing `/v1` API marked
pre-release; no database/auth; Vercel as initial host; system theme with a
persistent manual override; Swiss/International + Typography-Led direction
with restrained playful accents; Geist Sans/Mono candidates with fallbacks;
temporary text wordmark; static export only if compatible.

The production domain is not selected. Exact production CORS configuration and
deployment remain Phase 17 work and are not Phase 13 blockers. API CORS must
not be changed during Phase 13.

Phase 13 delivered the responsive static shell and route placeholders. The
interactive color tools, package guides, API reference, and playground are
planned for later phases and are not implemented. See [the Phase 13 checklist](tasks.md#phase-13--web-foundation-and-shell-complete)
for verification results and limitations.

## Evidence and proposals

Existing facts are drawn from the repository's `prd.md`, `architecture.md`,
`task.md`, package exports, API routes, OpenAPI contract, and deployment notes.
The approved website scope is separate from the completed package/API
acceptance criteria. See [the current project PRD](../../prd.md),
[architecture](../../architecture.md), and [phase history](../../task.md) for
the completed package/API cycle.
