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

The color modules are framework-independent. Routes perform request parsing and response shaping. `buildApp()` constructs Fastify and `server.ts` starts it. The Phase 2 engine validates and normalizes six color formats, preserves structured alpha, converts through full-precision sRGB/OKLab math, and reports CSS Color 4 local-MINDE mapping for sRGB-bounded outputs. Palettes still use HSL; tokens handle one color. The package has no public barrel or declarations, and the app has no OpenAPI/deployment layer.

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

- A color is a discriminated envelope `{ format, value }` with `format` equal to `hex`, `rgb`, `hsl`, `hsv`, `oklab`, or `oklch`.
- HEX accepts six or eight hexadecimal digits, optionally prefixed by `#`. Canonical output is lowercase `#rrggbb` for opaque values and `#rrggbbaa` when alpha is not opaque. The final byte is alpha.
- RGB uses integer `r/g/b` channels from 0 through 255. HSL/HSV use normalized hue degrees and percentage saturation/lightness/value. Both accept optional `alpha` in `[0,1]`.
- OKLab uses `l` in `[0,1]` and finite signed `a/b`; OKLCH uses `l` in `[0,1]`, finite `c >= 0`, and hue in degrees. Both accept optional `alpha` in `[0,1]`.
- Use the property name `alpha` consistently. Do not use `a` for alpha because `a` is a real OKLab axis. RGBA/HSLA are aliases for RGB/HSL structured values containing `alpha`, not additional `ColorFormat` discriminants.
- Omitted alpha means fully opaque (`alpha = 1`). Canonical structured values omit `alpha` when opaque and include it for non-opaque values. HEX8 necessarily quantizes alpha to an 8-bit byte; structured alpha remains floating point until output precision is applied.
- A zero-chroma/achromatic hue is mathematically powerless; normalized canonical output uses `h = 0` as a documented sentinel, not a measured hue.
- Public package functions accept `unknown` at validation boundaries and return typed normalized values or structured domain validation errors. Internal math functions may use typed prevalidated inputs.
- `validateColor` reports validity/errors without mutating; `normalizeColor` returns canonical structured output. Format detection is conservative and never guesses ambiguous values.
- Keep transport/request errors separate from color-domain errors. The REST adapter maps both to stable safe HTTP envelopes.

### Public operation contracts

- `validateColor(input)` is non-throwing for invalid input and returns a discriminated result: `{ valid: true, color }` or `{ valid: false, errors }`.
- Each validation issue has a stable code, a JSON Pointer `path` locating the problem (for example `/value/r` or `/colors/2/value/r`), and a human-readable message. Batch issues also carry a zero-based `index`; clients must not need to parse messages. `normalizeColor(input)` validates and returns canonical `ColorValue` or throws a typed domain error carrying those issues.
- `detectColorFormat(input)` is only a convenience: it recognizes a recognized explicit `format` tag even if its payload needs validation, or a hash-prefixed six/eight-digit HEX string; it returns `undefined` for ambiguous/unrecognized input. Format detection never proves validity. REST operations require an explicit color envelope and never infer RGB/HSL from arbitrary objects.
- `convertColor(input, outputFormat)` accepts a complete color envelope. A same-format request is valid and means canonical normalization. It returns `ColorConversionResult = { input, output, gamutMapped: false } | { input, output, gamutMapped: true, gamutMapping: "css-color-4-local-minde" }`. `input` is normalized in its source format; `output` is normalized in its target format after any gamut mapping. This wrapper is shared by package and REST results, including each batch item.
- Error types are pure domain errors, not Fastify-shaped exceptions. HTTP maps them to stable `INVALID_REQUEST`, `INVALID_COLOR`, `UNSUPPORTED_CONVERSION`, `UNSUPPORTED_MEDIA_TYPE`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, or `INTERNAL_ERROR` envelopes as applicable. Validation issue paths and batch `index` remain structured fields, not message parsing.
- The API is not yet publicly released; its existing `/v1` request shapes may be changed now to use the shared color envelope and normalization semantics. Preserve `/v1` endpoint names where practical, but do not preserve inconsistent behavior at the cost of package/API parity.

## Working representations, conversion, precision

- Do not route precision-sensitive conversions through integer 8-bit RGB.
- Use full-precision transforms among encoded sRGB, linear-light sRGB, OKLab, and OKLCH; D65 XYZ may be an internal transform if needed, not an automatic public format.
- Preserve intermediate floating-point precision; round only at public serialization boundaries.
- Keep full floating-point precision through internal transforms. At public structured-result boundaries, retain existing two-decimal HSL/HSV output; round OKLab/OKLCH coordinates and structured `alpha` to four decimal places. Use nearest-integer rounding for RGB channels and HEX bytes; canonicalize negative zero to zero. Normalize rounded hue again so serialized hue remains in `[0,360)`.
- HEX output is exact 8-bit sRGB. HEX8 alpha byte is `Math.round(alpha * 255)` for alpha in `[0,1]` (half-byte ties round upward); converting to/from HEX8 is therefore lossy and the returned structured value reflects the decoded/encoded byte at that boundary.
- Round only when creating public values/strings, not between mathematical steps. Package and API both call the same result-producing operation so JSON and package values have matching precision.
- Normalize hue to `0 <= h < 360`. Define achromatic/undefined hue convention.
- Tests use independent trusted reference vectors, round-trip tolerances, edge cases, and no exact-equality expectations across lossy quantization.
- Use W3C CSS Color 4 conversion and gamut-mapping algorithms and Björn Ottosson's original OKLab derivation/reference values as primary references: [CSS Color 4](https://www.w3.org/TR/css-color-4/), [OKLab derivation](https://bottosson.github.io/posts/oklab/). Record exact vectors/source in tests. Aim for `1e-6` absolute tolerance for unrounded OKLab/OKLCH transform reference values; use explicit byte-quantization-aware tolerances for paths through RGB/HEX.

## Alpha and compositing

- Alpha is independent from color-space coordinates and must survive conversions and supported serializers.
- Validate finite alpha in `[0,1]`; define rounding at output only.
- HEX8 is `#rrggbbaa`. RGBA/HSLA and modern-space serializers use documented CSS-compatible syntax.
- Mixing/interpolation uses premultiplied alpha to avoid transparent-color fringes; its color space is operation-specific and explicit.
- For `css-srgb-source-over`, with an opaque backdrop and encoded sRGB channels, `Cout = alphaForeground * Cforeground + (1 - alphaForeground) * Cbackdrop`; translucent backgrounds are first composited over the explicitly supplied opaque canvas using the same rule.
- Contrast involving transparency requires a fully resolved opaque backdrop. Use the named `css-srgb-source-over` model: convert the foreground, background, and optional canvas to encoded sRGB; composite the background over an opaque canvas if supplied; composite the foreground over that effective background using the simple source-over equation in encoded sRGB; expose the effective opaque colors/context; then linearize the final colors for WCAG luminance/contrast. If any required backdrop remains translucent or absent, reject the request rather than imply an absolute ratio. This is an explicit CSS-oriented model, not a claim that every graphics pipeline composites in encoded sRGB.
- Verify compositing behavior against the selected W3C CSS Color/Compositing contract and browser-facing tests.

## OKLab/OKLCH and gamut policy

- Support public OKLab and OKLCH alongside the existing sRGB formats; use D65 conventions and documented numeric ranges.
- Preserve out-of-sRGB coordinates in perceptual formats until a target gamut is requested.
- Every conversion to an sRGB-bounded output (HEX/RGB/HSL/HSV) must apply an explicit selected policy. Use the W3C CSS Color 4 §14.2.1 local-MINDE algorithm: convert to OKLCH, search chroma with the specified deltaEOK threshold `JND = 0.02` and binary-search epsilon `0.0001`, then clip the selected destination candidate as specified. At `L <= 0` map to black; at `L >= 1` map to white. Local-MINDE may accept a clipped candidate whose deltaEOK is below the JND, so it does not guarantee invariant lightness and hue. Report `gamutMapped: true` whenever an out-of-gamut color required mapping, including a sub-JND clipped result; report the algorithm as `"css-color-4-local-minde"`. In-gamut conversions report `gamutMapped: false`. Do not offer clipping unless a demonstrated use case justifies a separately named policy.
- OKLab `a/b` coordinates and OKLCH chroma are finite mathematical values; do not impose an arbitrary perceptual upper bound. Reject non-finite input and fail safely if an operation produces non-finite intermediates. OKLab/OKLCH lightness remains `[0,1]`; negative OKLCH chroma is invalid.
- Palette scales and suggestions operate in OKLCH but are evaluated after mapping to their output gamut.
- Reference test vectors must come from trustworthy published implementations/specification test data; record sources in tests/docs.

## Generation, palettes, manipulation

- Random generation is reproducible when seeded. Accept finite integer or string seeds; normalize strings with 32-bit FNV-1a and use a documented `mulberry32-v1` PRNG. The algorithm identifier is part of the reproducibility contract; unseeded generation is clearly nondeterministic, not cryptographic.
- Constraints are validated, bounded, and expressed in named color spaces/ranges.
- Keep palette strategies as explicit focused operations, not a generic registry. Preserve existing harmony strategies and add tetradic, shades, tints, tones, configurable counts where defined, and OKLCH perceptual scales.
- Keep the existing harmony palette hue relationships in HSL for compatibility; use OKLCH for perceptual scales, shades, tints, and tones. Document ordering, stop/count behavior, interpolation space, gamut policy, and alpha behavior per operation.
- Manipulation functions state their operation space (e.g. OKLCH lightness/chroma/hue or encoded sRGB invert). Mix/blend distinguish interpolation from alpha compositing and declare their math. Avoid ambiguous unqualified `lighten`/`saturate` semantics.
- `lighten/darken` adjust OKLCH lightness; `saturate/desaturate` adjust OKLCH chroma; hue rotation uses OKLCH hue; grayscale sets chroma to zero while preserving lightness; invert complements encoded sRGB channels. `mix` is interpolation (default OKLab with premultiplied alpha); compositing is a separate `compositeColors` source-over operation. These definitions are not interchangeable, and the API avoids the ambiguous name `blend`.

## Analysis and accessibility

- Analysis reports explicit metrics: relative luminance, contrast, light/dark heuristic, hue, saturation/chroma when meaningful, and color distance with a named distance formula/space.
- `isLight`/`isDark` are documented as heuristics using relative luminance `>= 0.5` for light; they do not describe perceived brightness universally. `deltaEOK` is the Euclidean distance in OKLab; report the numeric distance and do not imply a universal similarity threshold.
- WCAG calculations use sRGB relative luminance and unrounded ratios for thresholds, with rounded display values only.
- Results distinguish normal/large text AA/AAA. Large-text interpretation and criterion are documented.
- Large text follows WCAG's definition (at least 24 CSS px regular or approximately 18.67 CSS px bold); callers must supply/assert that context. Report AA/AAA thresholds separately (normal: 4.5/7; large: 3/4.5).
- Non-text contrast is contextual and tied to the applicable WCAG criterion, not a blanket UI compliance result.
- Non-text comparison names WCAG 2.2 SC 1.4.11 and the foreground/background boundary or graphical object being checked; apply its 3:1 threshold only for in-scope visual information and preserve stated exceptions.
- Candidate suggestions use deterministic search and return tested candidates, backdrop, threshold, and measured ratio. A candidate is revalidated after gamut mapping and compositing.
- First suggestion scope is foreground candidates for one explicit background, requesting an applicable WCAG threshold. Search both lightness directions in OKLCH at fixed hue/chroma, map and re-evaluate candidates, return at most the nearest passing candidate from each direction with deterministic distance/tie ordering. Bound search iterations and candidate count; no complete palette claim.
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
