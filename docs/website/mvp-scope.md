# ChromaForge website MVP scope

**Status: approved Phase 12 scope.** This website cycle follows package/API
Phases 0–11 and does not revise their acceptance criteria.

## Users and outcome

The primary users are frontend/full-stack developers, UI engineers, and design
system engineers. They should be able to try deterministic color operations,
understand the result and its assumptions, export usable values, and move from
the website to the npm package or HTTP API without learning a second color
engine.

## MVP priorities

### P0 — discover, try, and integrate

- Product homepage that explains the package/API, supported operations, and
  where calculations run; prominent entry points into tools and developer docs.
- Interactive converter for HEX/HEX8, RGB/RGBA, HSL/HSLA, HSV+A, OKLab+A, and
  OKLCH+A, with validation, normalization, alpha, copy, and visible gamut
  mapping metadata where the package returns it.
- Generator with count, optional seed, and OKLCH lightness/chroma/hue bounds;
  show when output is seeded or non-reproducible.
- Manipulation for hue, lightness, chroma, saturation, alpha, grayscale,
  invert, mix, and composite. Keep mix and source-over compositing distinct.
- HSL harmony palettes and shades/tints/tones; OKLCH stop-based scales.
- Contrast/accessibility tool for WCAG 2.2 text and contextual non-text checks,
  explicit alpha/backdrop context, and measured suggestions. Results describe
  only the evaluated pair and criterion.
- Color analysis for luminance, color classification/metrics, and deltaEOK
  distance. Do not invent a universal “similar” threshold.
- Design-token export for the existing CSS, SCSS, JSON, JavaScript,
  TypeScript, object, Tailwind-compatible, and document serializers.
- Interactive API playground for the existing documented `/v1` operations, with
  editable request JSON, response/error output, and copyable fetch/curl
  examples. Identify `/v1` as pre-release until its status changes.
- npm package quickstart, API reference for all documented operations, and
  integration examples grounded in existing exports and OpenAPI.
- Responsive navigation, light/dark themes, accessible controls, and complete
  loading, empty, validation, error, disabled, and success feedback.

### P1 — complete the developer experience

- Search/filter across package guides and the OpenAPI operation reference.
- Shareable tool URLs for simple, non-sensitive tool inputs, only after a clear
  encoding/privacy review. Do not store user projects on a server.
- Copyable generated output in additional formats only where an existing
  package serializer supports it.

## Non-goals

- Reimplementing conversion, color generation, gamut mapping, contrast, or
  serialization in website code.
- Accounts, authentication, persistence, saved projects, collaboration,
  billing, database, queue, or a server-side project API.
- AI color recommendations, semantic role assignment, broad “accessible
  palette” claims, or unsupported color spaces/exports.
- Arbitrary user-provided API hosts, arbitrary code execution, Postman import,
  public user uploads, or an API proxy/BFF in the MVP.
- Altering package exports, runtime semantics, existing Fastify routes, or
  OpenAPI contracts to fit a UI.

## Success criteria

- A new user can reach and complete every P0 tool journey using the existing
  package/API, with no duplicated color calculations.
- Each tool's inputs and output match its package operation and, where present,
  API route/OpenAPI contract; API errors remain safe and understandable.
- The API playground exposes only the documented API origin and known `/v1`
  operations and clearly labels API `/v1` pre-release status; reference docs
  cover all documented OpenAPI operations.
- npm installation and usage examples match the published package contract;
  API examples match OpenAPI.
- Required flows work with keyboard and touch, on 320 px through desktop
  viewports, at 200% zoom, and with reduced motion enabled.
- No critical/serious automated accessibility findings; manual keyboard and
  screen-reader smoke checks pass the agreed browser matrix.
- Production static build can be served without adding a database, API service,
  authentication provider, or changes to package/API behavior.

## Open product questions

- Confirm public domain/brand assets and whether the API playground is launch
  critical while `/v1` remains pre-release.
- Confirm light or dark as the first-visit default. Proposed default: follow the
  operating-system preference, with an explicit persistent toggle.
- Confirm whether the website is a portfolio/documentation surface or a
  product-level launch gate; this affects content depth and external support
  expectations.
