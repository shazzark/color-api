# ChromaForge website product requirements

**Status: approved website product scope.** The current package/API PRD remains
authoritative for color behavior. This document defines how the website
presents those behaviors.

## Product statement

ChromaForge Website is a responsive developer tool and documentation surface
for the existing deterministic color package and REST API. It helps a user
explore an operation in a browser, inspect precise assumptions/results, and
choose package or HTTP integration.

## Product boundaries

- The npm package is the computation source for in-browser tools.
- The API is the remote execution surface for the API playground and API
  examples. It remains anonymous and stateless as currently implemented.
- OpenAPI is the source of truth for HTTP operation names, request/response
  schemas, examples, and documented errors.
- The website owns presentation, navigation, input editing, and user feedback.
  It does not own color math or API policy.
- No user account, database, server-side project state, analytics, or AI is
  assumed in MVP.

## Core journeys

1. **Try a color operation:** Homepage → converter → enter/paste a supported
   color → choose output format → inspect canonical value/alpha/mapping → copy.
2. **Create a set:** Generator → set count/seed/constraints → select a result →
   adjust it or generate a palette/scale → export named tokens.
3. **Check contrast:** Contrast tool → enter foreground/background → provide a
   canvas for transparency when required → select text/non-text criterion and
   context → inspect measured ratio, effective colors, and qualified result.
4. **Understand a color:** Analysis tool → enter a supported color → inspect
   available metrics → compare a second color with deltaEOK and read its
   limitation.
5. **Integrate with npm:** Package docs → install `chromaforge` → copy a
   TypeScript example → see the equivalent website/package result.
6. **Explore HTTP:** API reference/playground → select a documented operation →
   edit its JSON example → send to the fixed public API origin → inspect
   response/status/request ID or safe error → copy fetch/curl.

## Functional requirements

- Color entry accepts only the existing six formats and reflects package
  validation/normalization results. Unsupported input gets an actionable
  inline error without discarding recoverable input.
- Tool result panels expose the exact output and relevant metadata; copy
  confirmation is announced, and clipboard denial has a manual-copy fallback.
- Random generation distinguishes seeded (`mulberry32-v1`) from unseeded
  (`Math.random`) output. Reuse the package's count/constraint semantics.
- Palette and scale controls expose only supported strategies, counts, stop
  constraints, ordering, and output formats.
- Contrast UI requires sufficient compositing context for transparent inputs;
  it states which pair, WCAG criterion, text size/context, and effective colors
  were evaluated. A passing result is not a whole-interface conformance claim.
- Token names use package validation and serializers. Downloads/copy are
  client-side and contain only the user's selected output.
- API requests are limited to documented operations on the configured public
  API origin. The UI displays safe response errors and does not send requests
  merely by editing a form.
- API docs show `/v1` pre-release status and do not imply a stable API SLA.
- Light/dark theme is explicit and persists only as a browser preference.
  Honor system preference before the user chooses a theme.

## Content and trust

- State that browser tools run the published package locally when that is the
  execution path; identify the API playground as a network request.
- Attribute guarantees to actual operation contracts. Do not claim universal
  accessibility, color accuracy on unmanaged displays, or unsupported format
  coverage.
- Show package version and link to the package changelog. Derive the API
  reference from OpenAPI to reduce drift.
- Avoid sending tool inputs to third parties. Do not add analytics or
  advertising without separate privacy review and approval.

## Product acceptance

See the measurable requirements in [MVP scope](mvp-scope.md) and
[technical requirements](trd.md). The user journeys above are acceptance paths,
not a commitment to features absent from current package/API contracts.
