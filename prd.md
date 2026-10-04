# Color API Product Requirements

## Product identity

- **Name:** Color API
- **Mission:** Provide developers with a dependable toolkit for color conversion, validation, analysis, accessibility, generation, manipulation, palettes, scales, and design-system output.
- **Product surfaces:** A reusable JavaScript/TypeScript package and a public versioned REST API share one deterministic color engine. A website will follow this development cycle and consume those surfaces. AI-assisted workflows are future work.

## Problem and users

Color behavior is spread across application code, inconsistent helper libraries, and manual design workflows. Developers need reusable, testable operations with explicit color-space, precision, gamut, transparency, and accessibility semantics.

Primary users are frontend and full-stack developers, UI engineers, design-system engineers, application developers, and teams integrating color operations from non-JavaScript clients through HTTP.

## Product principles

1. Deterministic color science owns calculations; AI never substitutes for it.
2. The package, API, and future website use the same domain behavior.
3. Every operation documents its color space, precision, alpha, and gamut assumptions.
4. Accessibility results identify the exact relationship and criterion evaluated.
5. Stateless operations need no account, database, or saved project.
6. Prioritize practical frontend and design-system value over academic completeness.
7. Keep package consumers independent of Fastify and server runtime concerns.

## Goals

- Deliver a publishable, browser-safe ESM package with named exports and TypeScript declarations.
- Deliver a publicly deployed, anonymous, rate-limited REST API with a versioned OpenAPI contract.
- Expand the current sRGB toolkit with alpha, OKLab/OKLCH, perceptual scales, useful deterministic generation/manipulation, analysis, accessibility, and design outputs.
- Keep API and package behavior consistent and verify them through consumer and public endpoint tests.
- Prepare the package/API for a separate website that will be built after this cycle.

## Non-goals

- Building the website in this repository during this cycle.
- AI features, AI SDKs, or provider integration during this cycle.
- Accounts, authentication requirements, databases, saved palettes, teams, dashboards, or billing.
- CommonJS compatibility without demonstrated demand.
- Broad color-format coverage for completeness; in particular, no public XYZ/Lab/LCH family or generic CMYK conversion is planned now.
- Framework-specific integration systems or a large exporter/plugin framework.

## Current capabilities

The inspected repository currently has a Fastify server and separate `src/color/` domain modules. It supports:

- `GET /health`
- `POST /v1/colors/convert`
- `POST /v1/colors/batch/convert` (Stage 7 recovery complete; checkpoint `16b7122`)
- `POST /v1/colors/contrast`
- `POST /v1/colors/palette`
- `POST /v1/colors/tokens`
- HEX/HEX8, RGB/RGBA, HSL/HSLA, HSV+A, OKLab+A, and OKLCH+A validation and conversion
- WCAG 2.2 text contrast, contextual SC 1.4.11 non-text checks, explicit source-over compositing context, color metrics, deltaEOK, and deterministic foreground suggestions
- Six deterministic HSL harmony strategies, including tetradic and configurable analogous counts
- Seeded/unseeded bounded OKLCH generation, OKLCH manipulation and mixing, and stop-based perceptual scales in the domain layer; REST routes and public package exports follow in later phases
- Single-color CSS custom-property tokens
- Synchronous, ordered, atomic batch conversion of 1–100 colors

Phase 2 implements full-precision transforms, alpha-aware normalization, OKLab/OKLCH conversion, and explicit CSS Color 4 local-MINDE sRGB gamut mapping in the framework-independent domain layer. Phase 3 adds context-specific WCAG evaluation and color analysis. Phase 4 adds deterministic generation, manipulation, and scales in the domain layer. Package exports, public deployment, OpenAPI, and CI remain in later phases. Stage 7 recovery is complete and checkpointed; see `task.md`.

## Scope and roadmap

### NOW — this development cycle

#### Color model and engine

- Preserve HEX, RGB, HSL, HSV and add alpha support, including HEX8, RGBA, HSLA, OKLab+A, and OKLCH+A representations.
- Add OKLab and OKLCH conversions to/from relevant supported spaces.
- Define stable validation, detection where unambiguous, normalization, structured errors, precision, and gamut behavior.
- Avoid quantizing intermediate calculations through 8-bit RGB.
- Preserve alpha across conversion and serialization. Transparent contrast must use an explicit compositing context.

#### Deterministic color operations

- Implement reproducible random generation, multiple-color generation, seeded generation, and useful constraints.
- Expand palette strategies to complementary, analogous, triadic, tetradic, split-complementary, monochromatic, shades, tints, tones, configurable counts where mathematically meaningful, and perceptual OKLCH scales.
- Implement useful deterministic manipulation: lightness/chroma/saturation changes, hue rotation, grayscale, invert, mix/blend, and alpha adjustment. Define the operation/interpolation space for each.
- Implement useful analysis: relative luminance, contrast, light/dark classification, hue, saturation/chroma when defined, color distance, and perceptual similarity.
- Implement WCAG text contrast and contextual non-text contrast where the requested comparison is accurately defined; provide candidate suggestions only when returned with explicit assumptions and measured results.

#### Developer outputs

- Retain CSS custom-property generation and extend it to multi-color token sets and generated scales.
- Add structured JSON design-token output, JavaScript object output, TypeScript-friendly typed objects, and a simple Tailwind-compatible representation that does not depend on a Tailwind runtime/version.
- Add SCSS serialization if it remains a small serializer.
- Add light/dark theme generation only if it composes cleanly from scales and verified contrast; otherwise keep it in NEXT.

#### Package and API

- Publish a named-export ESM package with declarations, browser-safe core code, Node support, and tree-shaking-friendly exports. Test the built package in Node and an actual browser-compatible environment before claiming browser support.
- Keep Fastify outside the package entry point.
- Make package and API semantics consistent, including same-format normalization.
- Keep the REST API anonymous at launch, versioned, rate-limited, request-bounded, CORS-configurable, documented, and publicly deployed.
- Ship OpenAPI, readable reference docs, curl/fetch/package examples, request/response/error examples, and a lightweight interactive spec view if it stays simple.

#### Production and release

- Add CI, production build verification, dependency review, safe logging/errors, environment validation, graceful shutdown, and public deployment smoke verification.
- Select a hosting provider at the deployment phase; keep architecture host-neutral until then.
- Publish the package only after package consumer checks pass and publishing credentials/authorization are available.

### NEXT

- Website implementation in a separate project/cycle, using the package for deterministic client-side operations and the API for hosted API exploration.
- Light/dark theme generation if not completed in NOW.
- Additional platform capabilities only when supported by demand: API keys/quotas, Postman collection, expanded observability, or richer export formats.
- APCA may be evaluated as a separate experimental metric; it must not replace stable WCAG results.
- Print/device color interoperability (XYZ/Lab/LCH/CMYK) only if a concrete use case establishes reference-white, profile, and conversion requirements.

### FUTURE

- Optional AI intent layer: natural language becomes a validated operation plan that invokes and verifies deterministic engine operations.
- Website/platform persistence (accounts, projects, saved palettes, sharing, teams) may be designed separately if needed; it is not part of the stateless engine/API.
- Additional color spaces, wide-gamut color support, or framework integrations only with concrete developer value and explicit color-management policies.

## Functional requirements

### Formats and conversion

- Core formats for this cycle: HEX/HEX8, RGB/RGBA, HSL/HSLA, HSV with alpha, OKLab with alpha, and OKLCH with alpha.
- Conversion must cover meaningful directed paths and same-format normalization.
- Preserve source alpha, define opaque defaults and canonical output, and document all lossy conversion boundaries.
- sRGB-target conversions from out-of-gamut OKLCH must use an explicit deterministic policy and expose whether mapping occurred. No silent clipping.
- Internal XYZ transforms are permitted where required; they are not public formats unless separately justified.

### Validation and normalization

- Package and API support validation and normalization as first-class operations.
- Errors are structured and stable; format detection must only claim reliable detections.
- Batch validation is included only if it provides useful atomic result/error behavior beyond conversion.

### Generation and palettes

- Seeded generation is reproducible for the same seed, constraints, and versioned algorithm.
- Unseeded generation is explicitly identified as non-reproducible.
- Palette algorithms document strategy, count, ordering, interpolation space, and boundary behavior.
- Perceptual scales use OKLCH and declare gamut mapping and stop semantics.

### Accessibility

- WCAG outputs distinguish normal and large text and AA/AAA thresholds.
- Non-text evaluations name the evaluated pair/context and criterion; they do not imply conformance of an entire interface.
- Transparent foreground/background evaluation requires sufficient backdrop information, composites deterministically, and reports effective colors/context.
- Suggestions return candidate colors, evaluated backgrounds, criteria, and measured ratios. No unqualified “accessible palette” claim.

### Outputs and batch

- Outputs are deterministic, injection-safe, and serialization-focused; avoid framework coupling.
- Multi-color token and scale output preserves order and semantic keys.
- Batch operations are added only where they materially reduce network calls; each must define size limits, order, atomicity, and indexed errors.

## Public API and package developer experience

- REST API remains under `/v1`, with OpenAPI as the machine-readable contract.
- Anonymous usage is supported with reasonable configurable limits; API keys/accounts are not required.
- Public errors are safe and consistent, including malformed input and payload-limit failures.
- Package has named exports, declarations, documented Node support, real browser compatibility tests, built-output consumer tests, and a public release/version policy.
- Documentation includes curl, fetch, package, request, response, and error examples. Postman is deferred.

## Security, reliability, and performance

- Stateless operations; validate all untrusted inputs.
- Bound request bodies, batch sizes, output counts, seed/constraint complexity, and logging data.
- Rate-limit public API traffic at a trusted layer; configure CORS for legitimate browser clients without credentialed wildcard origins.
- Validate environment variables; support graceful shutdown; use request IDs and structured logs without exposing internal errors or unnecessary payloads.
- CI runs install, tests, typecheck, and build. Dependency updates are reviewed regularly.
- Establish performance baselines when features are implemented and do a lightweight deployment smoke/load check before release. Do not add a permanent load-testing platform without a defined SLO or usage need.

## Success criteria

- The shared engine, package, and REST API implement the same documented operation semantics.
- OKLab/OKLCH and alpha behavior have trustworthy reference-vector and boundary tests.
- Gamut mapping, alpha compositing, and precision behavior are explicit and tested.
- WCAG outputs are correct for known vectors and clearly scoped to their evaluated pair/context.
- The built package can be imported by Node and passes real browser compatibility checks before browser support is claimed.
- CI passes; a package consumer check passes; OpenAPI matches the routes.
- The hosted public API URL is reached and smoke-tested successfully.
- The public package is installable if npm publishing credentials and authorization are available.

## Release strategy

Stage 7 recovery and the Phase 1 contract plan are complete. Continue with Phase 2 color math, then derived operations/accessibility, serialization, package/API surfaces, CI/docs, and deployment. Keep commits focused and checkpointed. The release is not complete until deployment health smoke tests succeed; package publication requires its own artifact/consumer verification.
