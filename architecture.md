# Color API Architecture

## Architecture goals

- One deterministic domain engine serves the JavaScript/TypeScript package, REST API, and future website.
- Keep domain behavior independent of Fastify, network access, persistence, and AI providers.
- Make alpha, precision, gamut, and accessibility assumptions explicit at API boundaries.
- Prefer a single package/repository over a monorepo until an independently deployed product requires one.
- Preserve stateless, synchronous color operations with bounded input and output sizes.

## Current architecture

```text
src/color/{types,validation,conversion,contrast,palette,tokens}.ts
                    ↑
src/routes/*.ts → src/app.ts → src/server.ts
```

The color modules are largely framework-independent. Routes perform request parsing and response shaping. `buildApp()` constructs Fastify and `server.ts` starts it. Current conversions route through integer sRGB RGB; palettes use HSL; tokens handle one color. The package has no public barrel or declarations, and the app has no OpenAPI/build/deployment layer.

## Target architecture

```text
                deterministic color engine
                  /             |             \
        ESM package        Fastify API       future website
                              |                 (separate work)
                              |
              future AI intent/orchestration layer
                   validated operation plan
                              ↓
                 deterministic color engine
```

The AI layer is future-only. It must not enter the engine’s dependency graph. Website UI is not built in this cycle; it imports the browser-tested package and may call the hosted API.

## Repository/package boundaries

Keep one repository and one npm package initially:

- `src/color/`: pure domain types, validation, transforms, operations, analyses, and serializers.
- `src/index.ts` (or equivalent public barrel): named package exports only; no Fastify/server imports.
- `src/routes/`: REST adaptation, transport validation, status codes, and response mapping.
- `src/app.ts`: Fastify composition, plugins, schemas, hooks, error handler, health/readiness routes.
- `src/server.ts`: environment validation, listen, and graceful shutdown.
- `tests/`: domain unit tests, route contract tests, package consumer tests, and controlled smoke tests.
- `docs/` or root docs: OpenAPI and developer reference material.

Do not add workspaces/monorepo until there are multiple independently released packages or the website belongs in this repository. Fastify is an API-only dependency and must not be imported by package entry points.

## Domain types, validation, and normalization

- Retain discriminated color values with formats `hex`, `rgb`, `hsl`, `hsv`, `oklab`, and `oklch`.
- Model optional alpha consistently as `a` in the inclusive range 0–1; omitted alpha means fully opaque. Canonical serializers omit alpha for opaque colors unless the caller explicitly requests an alpha form. HEX8 uses CSS-style trailing alpha byte.
- HEX accepts documented 6/8-digit forms, with canonical lowercase output. RGB channels remain 0–255; other channel ranges and units are format-specific and documented.
- Public package functions accept `unknown` at validation boundaries and return typed normalized values or structured domain validation errors. Internal math functions may use typed prevalidated inputs.
- `validateColor` reports validity/errors without mutating; `normalizeColor` returns canonical structured output. Format detection is conservative and never guesses ambiguous values.
- Keep transport/request errors separate from color-domain errors. The REST adapter maps both to stable safe HTTP envelopes.

## Working representations, conversion, precision

- Do not route precision-sensitive conversions through integer 8-bit RGB.
- Use full-precision transforms among encoded sRGB, linear-light sRGB, OKLab, and OKLCH; D65 XYZ may be an internal transform if needed, not an automatic public format.
- Preserve intermediate floating-point precision; round only at public serialization boundaries.
- Preserve existing HSL/HSV output precision where compatible; document precision for OKLab/OKLCH and alpha explicitly before implementation. HEX/RGB serialization necessarily quantizes to 8-bit sRGB.
- Normalize hue to `0 <= h < 360`. Define achromatic/undefined hue convention.
- Tests use independent trusted reference vectors, round-trip tolerances, edge cases, and no exact-equality expectations across lossy quantization.

## Alpha and compositing

- Alpha is independent from color-space coordinates and must survive conversions and supported serializers.
- Validate finite alpha in `[0,1]`; define rounding at output only.
- HEX8 is `#rrggbbaa`. RGBA/HSLA and modern-space serializers use documented CSS-compatible syntax.
- Mixing/interpolation uses premultiplied alpha to avoid transparent-color fringes; its color space is operation-specific and explicit.
- Contrast involving transparency requires a fully resolved opaque backdrop. Convert colors to encoded sRGB, apply the W3C simple source-over alpha formula in encoded sRGB, expose effective colors/context, then linearize the composite for WCAG luminance/contrast. If a translucent backdrop lacks an opaque canvas, reject the request rather than imply an absolute ratio. Name this behavior in the API so callers can distinguish it from linear-light compositing used by other operations.
- Verify compositing behavior against the selected W3C CSS Color/Compositing contract and browser-facing tests.

## OKLab/OKLCH and gamut policy

- Support public OKLab and OKLCH alongside the existing sRGB formats; use D65 conventions and documented numeric ranges.
- Preserve out-of-sRGB coordinates in perceptual formats until a target gamut is requested.
- Every conversion to sRGB-bounded output must apply an explicit selected policy. Default perceptual mapping should reduce OKLCH chroma while preserving lightness/hue as far as the defined algorithm allows; report `gamutMapped` metadata. Explicit clipping may be offered only as a named alternative, never as silent behavior.
- Palette scales and suggestions operate in OKLCH but are evaluated after mapping to their output gamut.
- Reference test vectors must come from trustworthy published implementations/specification test data; record sources in tests/docs.

## Generation, palettes, manipulation

- Random generation is reproducible when seeded. Specify the PRNG/seed expansion and version the algorithm contract; unseeded generation is clearly nondeterministic.
- Constraints are validated, bounded, and expressed in named color spaces/ranges.
- Keep palette strategies as explicit focused operations, not a generic registry. Preserve existing harmony strategies and add tetradic, shades, tints, tones, configurable counts where defined, and OKLCH perceptual scales.
- Document ordering, stop/count behavior, interpolation space, gamut policy, and alpha behavior per operation.
- Manipulation functions state their operation space (e.g. OKLCH lightness/chroma/hue or encoded sRGB invert). Mix/blend distinguish interpolation from alpha compositing and declare their math. Avoid ambiguous unqualified `lighten`/`saturate` semantics.

## Analysis and accessibility

- Analysis reports explicit metrics: relative luminance, contrast, light/dark heuristic, hue, saturation/chroma when meaningful, and color distance with a named distance formula/space.
- WCAG calculations use sRGB relative luminance and unrounded ratios for thresholds, with rounded display values only.
- Results distinguish normal/large text AA/AAA. Large-text interpretation and criterion are documented.
- Non-text contrast is contextual and tied to the applicable WCAG criterion, not a blanket UI compliance result.
- Candidate suggestions use deterministic search and return tested candidates, backdrop, threshold, and measured ratio. A candidate is revalidated after gamut mapping and compositing.
- APCA is not a stable replacement for WCAG in this cycle; it may be documented as future/experimental only.
- Named/closest colors require a defensible dataset and metric before implementation; otherwise omit.

## Design-system outputs

- Core serializers accept typed tokens/colors and return strings/objects; they do not know about frameworks or filesystems.
- Support CSS custom properties, structured JSON tokens, JS objects, TypeScript-friendly objects, generated scales, and a simple Tailwind-compatible object/config shape.
- SCSS output is a small optional serializer. Tailwind output is a data shape, not a plugin or version-specific integration.
- Validate names before interpolation; escape or reject unsafe values. Keep semantic token naming separate from mathematical color generation.
- Light/dark theme generation may compose the same scale/accessibility functions. If robust role assignment requires a large policy system, defer the automatic theme generator without changing core boundaries.

## Package exports and build

- Publish ESM only; do not create CJS until demand is demonstrated.
- Export named functions/types by capability and ensure side-effect-free modules for tree shaking.
- Emit `.js` and `.d.ts` artifacts with explicit `exports`, `types`, `files`, supported Node `engines`, and package metadata.
- Separate package and server build configurations; exclude tests/docs from published output.
- Keep dependencies out of the color math layer. Inspect `npm pack --dry-run` and artifact contents/size.
- Test built package imports in supported Node versions and test browser compatibility in a real browser-compatible environment before claiming it. Do not import Fastify from package consumer tests.

## HTTP architecture and API contracts

- Keep `/v1` routes and make each handler a thin adapter over package/domain operations.
- Use shared request schemas/types where they can drive runtime validation and OpenAPI without duplicating operation semantics.
- Same-format conversion delegates to normalization; single and batch contracts must agree.
- Batch operations remain bounded, ordered, and explicit about atomicity/indexed errors. Add batch endpoints only for meaningful network-call reduction.
- Stable envelope distinguishes malformed requests, invalid colors, unsupported operations, and internal failures. Never reveal internal stack traces.
- Add request IDs, safe structured logging, configured payload limits, CORS allowlist/configuration, and conservative rate limiting at one trusted layer. Do not trust forwarded client IP headers unless deployment proxy configuration validates them.
- Anonymous access first. Keep future key/quota middleware at the HTTP edge.
- OpenAPI is the machine-readable API contract; Swagger UI is a lightweight presentation of that contract, not a second source of truth.

## Runtime, security, deployment, observability

- Validate `HOST`, `PORT`, rate-limit, CORS, and deployment environment configuration at startup.
- Bind according to host platform requirements; close Fastify gracefully on SIGTERM/SIGINT.
- Keep liveness simple. Add readiness only if platform startup/dependencies need it; no external dependencies exist today.
- Body and batch/output limits prevent resource abuse. No database, queue, worker, account system, or broad monitoring platform is needed.
- CI runs reproducible install, tests, typecheck, and production build. Dependency audit/update workflows should be useful and reviewed, not flaky PR blockers.
- Deployment stays host-neutral until the deployment phase selects a provider. A release requires reaching the public URL and passing smoke checks.
- Establish basic API latency/throughput baselines before setting performance guarantees; defer ongoing load infrastructure absent need.

## Testing architecture

- Domain unit tests: transforms, validation, alpha, precision, gamut, generation, manipulations, analysis, accessibility, and serializers.
- Route tests: Fastify `inject` for schemas, status/envelopes, malformed requests, bounds, CORS, rate limiting, and parity with package operations.
- Package consumer tests import built output and check exports/types; browser compatibility is verified in an actual browser test environment.
- Golden/reference tests use independent published vectors; property tests use justified tolerances and edge invariants.
- Build/release smoke checks validate the production artifact and live health endpoint. Load tests are occasional release checks once measurable targets exist.
- No test-count target; add tests for contracts and regressions.

## Future website, AI, and persistence

- Website is a separate future surface that imports browser-tested package exports and can call public API operations.
- Keep UI state, routing, visual editors, and docs presentation outside the core engine.
- Future AI flow: natural-language request → validated typed operation plan → deterministic engine → verified result. AI may interpret/explain, never calculate authoritative color/contrast/gamut/accessibility values.
- Provider SDKs, prompts, retries, cost/privacy policy, and model-output validation belong to a separate orchestration layer.
- Persistence, if later required for website projects/accounts/sharing, belongs behind a separate service boundary and is not introduced into the package or stateless API.

## Architecture decisions

| Decision | Rationale / tradeoff |
|---|---|
| One repository/package initially; no monorepo | Current engine and API form one product; avoid workspace overhead until independent deployment/versioning exists. |
| ESM-only package | Matches repository and modern targets; CJS compatibility is deferred absent demand. |
| High-precision transforms, no integer RGB hub | Prevents avoidable rounding error in OKLab/OKLCH and alpha operations. |
| Public OKLab/OKLCH; no automatic public XYZ/Lab/LCH expansion | Strong frontend/design-system value without academic format sprawl. |
| Explicit OKLCH gamut mapping for sRGB output | Avoids silent clipping or misleading numeric preservation. |
| Alpha requires explicit contrast backdrop | A transparent pair has no context-free rendered contrast. |
| WCAG results remain contextual and criterion-specific | Avoids overclaiming full accessibility from one pair. |
| Anonymous API with edge rate limiting | Low-friction initial access; future auth belongs at HTTP boundary. |
| OpenAPI as contract | One machine-readable source, with docs/UI generated or rendered from it. |
| Stateless core/API | Keeps developer operations deterministic and low-operations. |
