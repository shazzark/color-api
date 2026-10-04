# Color API Execution Plan

This is the execution source of truth. Work phase-by-phase, update checkboxes/status after review, and do not skip dependencies. `COMPLETE` means its definition of done and verification passed. A feature present in staged source is not a completed Git checkpoint until safely reviewed and recorded.

## Current baseline

- Existing core/API functionality: six-format alpha-aware validation/conversion, contextual WCAG 2.2 contrast, color analysis and suggestions, six harmony palettes, multi-color serializers, health endpoint, and domain generation/manipulation/scales.
- Batch conversion is committed in checkpoint `16b7122`; preserve its implementation.
- Current tests are in fourteen files and cover conversion, contrast, palette, token serialization, route parity, batch, domain operations, API hardening, and OpenAPI contract parity. Vitest uses `forks`.
- Phase 9 CI/release checks are complete and checkpointed; public deployment remains. Package exports/declarations, multi-color serializers, Phase 4 generation/manipulation/scale routes, and Phase 7 API hardening are implemented and checkpointed.
- Do not mark prior behavior complete without rerunning the required verification in the recovery phase.

## Phase 0 — Stage 7 recovery and Git hygiene

**OBJECTIVE:** Safely finish the already-staged batch-conversion milestone and resolve its line-ending issue without losing user work.

**STATUS:** COMPLETE

**DEPENDENCIES:** None.

**TASK CHECKLIST:**

- [x] Batch route supports 1–100 mixed input colors, shared output format, order preservation, atomic failure, and zero-based invalid index.
- [x] Batch endpoint tests cover bounds, ordering, mixed inputs, defaults, and errors.
- [x] README and `AGENTS.md` already describe Stage 7 behavior in the staged change set.
- [x] Inspect staged and unstaged diffs and compare each Stage 7 file against HEAD before changing anything.
- [x] Identify exact line-ending-only differences and repository `.gitattributes` behavior; preserve substantive staged changes.
- [x] Normalize only the intended Stage 7 files if needed; do not alter Git configuration.
- [x] Run `npm test`, `npm run typecheck`, and `npm run build` after safe normalization.
- [x] Perform an HTTP health smoke check against the built server to confirm the existing release path.
- [x] Have independent Git, API architecture, and QA reviewers confirm the Stage 7 diff and behavior.
- [x] Lead agent reviewed the final diff and made focused Stage 7 checkpoint `16b7122` (`feat: add batch color conversion`).

**SUBAGENTS TO USE:** API architecture reviewer; QA reviewer; independent Git diff reviewer. Subagents inspect/report only; lead agent alone mutates Git.

**SKILLS TO USE:** No repository-specific skill is present in the available catalog. Use a relevant skill only if a later provider/tool workflow calls for one.

**TESTS REQUIRED:** Existing full test suite, typecheck, build, batch endpoint cases.

**VERIFICATION COMMANDS:** `git status --short`; `git diff --cached`; `git diff`; `git diff --cached --check`; `npm test` (155 tests, 9 files); `npm run typecheck`; `npm run build`; built server `GET /health` returned `{"status":"ok"}`.

**DOCUMENTATION UPDATES:** Confirm `README.md` and `AGENTS.md` match actual Stage 7 behavior; do not re-document the batch feature from scratch.

**GIT CHECKPOINT:** Complete as `16b7122`. Added explicit `* text=auto eol=lf` repository policy and normalized only the intended Stage 7 files; local `core.autocrlf=true` was not changed. No user work was discarded.

**DEFINITION OF DONE:** Line-ending issue is understood and corrected only where needed, Stage 7 behavior passes all verification, review confirms no loss, and Git checkpoint is clean and focused.

## Phase 1 — Public domain contracts and reference plan

**OBJECTIVE:** Define the typed public operation/error contracts and mathematical conventions before expanding the engine.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phase 0.

**TASK CHECKLIST:**

- [x] Inventory current public helpers and map them to package/API operations.
- [x] Define format/value types for HEX/HEX8, RGB/RGBA, HSL/HSLA, HSV+A, OKLab+A, OKLCH+A.
- [x] Define alpha default, optionality/canonical omission, units, serialization, hue conventions, precision, and normalization behavior.
- [x] Define structured domain validation errors separately from HTTP errors.
- [x] Define same-format conversion as normalization and settle output metadata for gamut mapping.
- [x] Define operation spaces/interpolation semantics for manipulation, mixing, scales, and analysis.
- [x] Select trustworthy reference-vector sources and tolerances; record the source beside fixtures.
- [x] Define conservative format-detection input rules and reject ambiguity.
- [x] Review API/backwards-compatibility policy for the not-yet-public `/v1` contract.

**SUBAGENTS TO USE:** Product, color science, package, and API architecture reviewers.

**SKILLS TO USE:** None currently relevant in the catalog; check again if tooling/platform choices change.

**TESTS REQUIRED:** Contract-level type tests and validation test plan; no implementation tests until the contracts are agreed internally.

**VERIFICATION COMMANDS:** `npm run typecheck`; review type/API documentation and reference data provenance.

**DOCUMENTATION UPDATES:** Update `architecture.md` with finalized types/precision/gamut decisions and this phase’s decisions log.

**GIT CHECKPOINT:** Focused contract/design checkpoint.

**DEFINITION OF DONE:** Each public color representation and cross-operation semantic has a documented, testable contract; no unresolved alpha/gamut/precision ambiguity remains. Complete after review by product, color-science, package, and API reviewers; `npm run typecheck` passed. Architecture records W3C CSS Color 4 local-MINDE constants/limits, JSON Pointer validation paths, result metadata, and explicit source-over context.

## Phase 2 — High-precision core, validation, alpha, and color spaces

**OBJECTIVE:** Implement validated conversion and normalization for existing formats plus alpha-aware OKLab/OKLCH without lossy 8-bit intermediates.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phase 1.

**TASK CHECKLIST:**

- [x] Refactor conversion internals to retain floating-point precision through transformations.
- [x] Add OKLab/OKLCH forward/inverse transforms and supported cross-format dispatch.
- [x] Add alpha validation and preservation to every supported structured format and HEX8.
- [x] Implement canonical normalization and same-format conversion consistently.
- [x] Implement explicit sRGB gamut mapping for out-of-gamut OKLCH conversion; return/report mapping metadata.
- [x] Define and implement canonical opaque/transparent serialization behavior.
- [x] Add strict public `validateColor`, `normalizeColor`, and reliable format-detection operations.
- [x] Keep lower-level pure math independent of Fastify.
- [x] Document unsupported color formats and ambiguous string parsing.

**SUBAGENTS TO USE:** Color science reviewer; independent transform/reference-vector reviewer; package/API reviewer.

**SKILLS TO USE:** None presently relevant; use only a discovered color-science/development skill if available at execution time.

**TESTS REQUIRED:** All meaningful directed conversions; alpha preservation; HEX8 boundaries; achromatic hue convention; finite/range errors; trusted OKLab/OKLCH vectors; round-trip tolerances; in/out-of-gamut mapping; precision and normalization; malformed unknown values.

**VERIFICATION COMMANDS:** `npm test` (166 tests, 9 files); `npm run typecheck`; `npm run build`; `git diff --check`. Independent color-science review found no confirmed transform/alpha defects. Independent QA review findings for route coverage and structured error paths were addressed. Vitest required execution outside the restricted sandbox because esbuild could not load its config there.

**DOCUMENTATION UPDATES:** Synchronize format/range/precision/alpha/gamut contracts in `README.md`, `prd.md`, and `architecture.md`.

**GIT CHECKPOINT:** Focused core format/conversion checkpoint after independent review.

**DEFINITION OF DONE:** Every supported conversion is deterministic, alpha-preserving, validated, precision-documented, gamut-explicit, and covered by independent reference and boundary tests. Phase 2 checkpoint committed after final diff review.

## Phase 3 — Analysis, compositing, and accessibility

**OBJECTIVE:** Provide reliable analysis and criterion-specific WCAG checks, including transparent colors and deterministic suggestions.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phase 2.

**TASK CHECKLIST:**

- [x] Implement deterministic alpha compositing with explicit opaque backdrop requirements and documented CSS-compatible model.
- [x] Implement relative luminance and WCAG contrast using effective composited colors; evaluate thresholds before display rounding.
- [x] Add normal/large text AA/AAA results and explicitly scoped non-text contrast evaluations.
- [x] Add useful light/dark classification and hue/saturation/chroma metrics where defined.
- [x] Add named perceptual color distance/similarity metric and document its limits.
- [x] Add deterministic accessible foreground/background candidate search; verify candidates after gamut mapping/compositing.
- [x] Include criteria, assumptions, effective colors, and measured ratios in all accessibility result models.
- [x] Exclude broad “accessible palette” claims and keep APCA out of stable WCAG results.

**SUBAGENTS TO USE:** Color science/accessibility reviewer; product reviewer; independent QA reviewer.

**SKILLS TO USE:** None currently relevant.

**TESTS REQUIRED:** Published WCAG vectors, threshold boundaries, opaque and transparent compositing cases, missing backdrop errors, non-text criteria/exceptions in scope, gamut-mapped candidates, deterministic recommendations, distance vectors.

**VERIFICATION COMMANDS:** `npm test` (183 tests, 9 files); `npm run typecheck`; `npm run build`; `git diff --check`. Independent color-science and QA reviews found no remaining blockers; review feedback on candidate threshold context, runtime RGB validation, and route context handling was addressed.

**DOCUMENTATION UPDATES:** Document evaluated criteria, thresholds, large-text assumptions, compositing, and limitations in API/package docs and `prd.md`.

**GIT CHECKPOINT:** Focused accessibility/analysis checkpoint after expert review.

**DEFINITION OF DONE:** Results can be traced to a stated criterion, input context, compositing result, and reproducible calculation; no generalized conformance claim is emitted. Phase 3 checkpoint committed after final diff review.

## Phase 4 — Generation, manipulation, palettes, and perceptual scales

**OBJECTIVE:** Add deterministic operations useful for frontend and design-system work.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phase 2; Phase 3 for accessibility-aware candidate checks.

**TASK CHECKLIST:**

- [x] Implement seeded random color generation with documented/versioned PRNG and bounded constraints.
- [x] Support multiple generated colors while preserving seed reproducibility and order.
- [x] Define unseeded generation as explicitly nondeterministic.
- [x] Implement hue rotation, lightness/chroma/saturation adjustment, grayscale, invert, and alpha adjustment with named operation spaces.
- [x] Implement mix/interpolation and blend/compositing as distinct operations with explicit spaces and premultiplied-alpha behavior where needed.
- [x] Expand harmony palettes with tetradic and configurable offsets/counts where meaningful.
- [x] Implement monochromatic shades, tints, tones, and document differences/ordering.
- [x] Implement configurable deterministic OKLCH scales with stop semantics, monotonicity, and gamut mapping.
- [x] Keep simple fixed harmony strategies explicit; avoid registries and arbitrary plugin frameworks.

**SUBAGENTS TO USE:** Product reviewer; color-science reviewer; independent API usability reviewer.

**SKILLS TO USE:** None currently relevant.

**TESTS REQUIRED:** Seed reproducibility/version vectors; constraint bounds; palette hue wrapping/counts; exact stop/order behavior; OKLCH scale monotonicity and gamut boundaries; manipulation reference values; mixing and alpha edge cases.

**VERIFICATION COMMANDS:** `npm test` (198 tests, 10 files); `npm run typecheck`; `npm run build`; `git diff --check`. Independent color-science review found and helped fix an 8-bit precision loss in encoded-sRGB inversion; API and product reviews found no remaining contract blocker.

**DOCUMENTATION UPDATES:** Add operation examples and mathematical semantics to package/API docs; update roadmap and API types.

**GIT CHECKPOINT:** Phase 4 implementation checkpoint after final full-suite verification and diff review.

**DEFINITION OF DONE:** Operations are deterministic when seeded, semantically explicit, bounded, and tested at boundaries and with reference values. Phase 4 is complete and checkpointed after independent review.

## Phase 5 — Multi-color design-system outputs

**OBJECTIVE:** Serialize tokens and generated scales into useful framework-light developer formats.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phases 2–4.

**TASK CHECKLIST:**

- [x] Preserve and generalize CSS custom-property serialization to ordered multi-color tokens/scales.
- [x] Add structured JSON design-token output with a documented stable shape.
- [x] Add JavaScript object and TypeScript-friendly typed object forms.
- [x] Add simple Tailwind-compatible data/config output without Tailwind runtime/version coupling.
- [x] Add SCSS variables as a small validated serializer.
- [x] Validate token keys before CSS/SCSS interpolation and reject unsafe names.
- [x] Evaluate light/dark theme generation using existing deterministic scales and contrast checks; defer automatic role assignment until a product role policy exists.
- [x] Ensure serialization contains no hidden file or framework side effects.

**SUBAGENTS TO USE:** Developer-experience reviewer; package reviewer; security reviewer for serialization safety.

**SKILLS TO USE:** None presently relevant; do not invoke Figma/Sites skills for this backend-only serializer phase.

**TESTS REQUIRED:** Deterministic serializers, escaping/unsafe names, alpha output, ordering, JSON shape, typed-object compile fixture, Tailwind shape, scale outputs, theme contrast if theme generation is included.

**VERIFICATION COMMANDS:** `npm test` (207 tests, 10 files); `npm run typecheck`; `npm run build`; `git diff --check`. Independent DX, package, and security reviews found and helped close single-token CSS injection paths; no framework dependency was introduced.

**DOCUMENTATION UPDATES:** Add output schemas/examples and any deferred theme items to `prd.md`/`task.md`.

**GIT CHECKPOINT:** Focused serializer/output checkpoint after full verification and independent review.

**DEFINITION OF DONE:** Outputs are deterministic, safe, version-agnostic where promised, and usable without framework dependencies. Light/dark role assignment is documented as deferred because current operations do not define semantic roles or a product policy. Phase 5 is complete and checkpointed.

## Phase 6 — Public package build and browser compatibility

**OBJECTIVE:** Turn the pure engine into a consumable ESM package and verify built artifacts in Node and browsers.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phases 1–5.

**TASK CHECKLIST:**

- [x] Add public named-export barrel for domain functions and types only.
- [x] Separate package TypeScript build from server/tests and emit declarations.
- [x] Configure ESM exports, package files, Node engine range, metadata, and side-effect-free exports.
- [x] Verify tree-shakeable module boundaries and absence of Fastify from package graph.
- [x] Add built-output Node consumer tests and typed usage fixture.
- [x] Add an actual browser compatibility test before claiming browser support.
- [x] Inspect `npm pack --dry-run`, artifact file list, and size.
- [x] Write package README/quickstart/examples and SemVer/changelog policy.
- [x] Prepare npm publishing workflow; do not publish until release review and credentials/authorization.

**SUBAGENTS TO USE:** Package architecture reviewer; browser compatibility reviewer; independent consumer DX reviewer.

**SKILLS TO USE:** None presently relevant. If an npm/release integration skill becomes available and is relevant, inspect it before use.

**TESTS REQUIRED:** Public export contract, Node import, TypeScript declaration consumption, actual browser execution, package content/size inspection, no Fastify dependency leak.

**VERIFICATION COMMANDS:** `npm test` (208 tests, 11 files); `npm run typecheck`; `npm run build`; `npm run package:types`; `npm run package:smoke`; `npm pack --dry-run --json` (19 files; 21,307 packed / 82,740 unpacked bytes); browser smoke on Chrome 154 / Windows passed (`oklch`, `gamutMapped: false`, two seeded colors); `git diff --check`. Browser exercise used the emitted `dist/package` ESM modules over local HTTP, not a bundle.

**DOCUMENTATION UPDATES:** Package usage guide, supported runtimes, examples, versioning and release policy.

**GIT CHECKPOINT:** Package build/export checkpoint; public publication is a separate release action.

**DEFINITION OF DONE:** Built package resolves through its ESM export map for Node and TypeScript consumers, is verified in a browser environment, includes only intended artifacts, and has complete declarations. Package remains `private` until release review and user authorization; it has not been published.

## Phase 7 — REST API parity and public hardening

**OBJECTIVE:** Expose approved engine functions as a coherent, safe, bounded public API.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phases 1–6.

**TASK CHECKLIST:**

- [x] Map package operations to justified versioned routes; do not add batch endpoints for symmetry alone.
- [x] Make single conversion same-format requests normalize consistently with package and batch semantics.
- [x] Define validation, normalize, generation, scales, manipulation, analysis, accessibility, token, and justified batch contracts.
- [x] Centralize HTTP error mapping for domain errors, malformed JSON, unsupported media types, not found, oversized bodies, rate limits, and internal failures.
- [x] Add request body, batch, generation, and output limits.
- [x] Add anonymous configurable rate limiting at one trusted layer and document proxy/client IP assumptions.
- [x] Add configurable browser CORS suitable for public website usage; no credentialed wildcard.
- [x] Validate environment config and deployment-compatible host/port at startup.
- [x] Add safe structured logging/request IDs and graceful SIGTERM/SIGINT close.
- [x] Keep liveness and readiness semantics simple and accurate.
- [x] Keep future API key/quota extension at HTTP boundary only.

**SUBAGENTS TO USE:** API architecture reviewer; security/reliability reviewer; independent penetration/input-boundary reviewer.

**SKILLS TO USE:** None currently relevant.

**TESTS REQUIRED:** Route parity with package, stable envelopes/status, malformed body/content type, 404, limits, CORS preflight/origins, rate limit, request IDs, safe internal errors, shutdown/config validation.

**VERIFICATION COMMANDS:** `npm test` (217 tests, 13 files); `npm run typecheck`; `npm run build`; built `GET /health` returned `{"status":"ok"}` and `POST /v1/colors/normalize` normalized `#AABBCC` to `#aabbcc`; built server accepted the SIGTERM shutdown handler and exited cleanly. `git diff --check` passed. Vitest needed elevated filesystem access because esbuild could not load its config in the restricted sandbox. Independent API architecture review found no route/domain boundary issues; security/reliability review found no critical exploit and confirmed documented process-local rate-limit assumptions.

**DOCUMENTATION UPDATES:** Update API examples, errors, limits, CORS/rate policy, health/readiness and configuration docs.

**GIT CHECKPOINT:** Route families may be separate focused commits; review contract consistency at each checkpoint.

**DEFINITION OF DONE:** API is a thin adapter over package behavior, bounded for anonymous public use, and consistent for all documented HTTP failures.

## Phase 8 — OpenAPI and developer documentation

**OBJECTIVE:** Make the package and REST API discoverable and contract-driven.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phase 7 API contracts.

**TASK CHECKLIST:**

- [x] Add OpenAPI 3 specification covering every public route/schema/error/limit.
- [x] Ensure runtime route schemas and OpenAPI do not drift; add a contract check that validates the generated artifact and registered routes.
- [x] Add readable API reference and lightweight interactive API explorer from the same spec.
- [x] Add curl and JavaScript fetch examples plus package examples.
- [x] Include complete request, success response, validation, error, alpha, gamut, and accessibility-context examples.
- [x] Document API version/deprecation, anonymous limits, CORS, and local deployment use.
- [x] Defer Postman collection.

**SUBAGENTS TO USE:** Developer-experience reviewer; API contract reviewer; QA reviewer.

**SKILLS TO USE:** None presently relevant.

**TESTS REQUIRED:** OpenAPI schema validation, route/spec contract check, documentation example smoke tests where practical.

**VERIFICATION COMMANDS:** `npm test` (224 tests, 14 files); focused OpenAPI contract tests (7 passed); `npm run typecheck`; `npm run build`; `npm run openapi:check` (20 operations, Redocly lint); `git diff --check`. Documented request examples validate against their schemas and execute through handlers; normalize/palette/token include structured-format requests; malformed validation input returns the documented false-result shape; palette, scale, and variant response examples match handler output. CORS preflight 403 is represented in the OpenAPI transport extension. The route guard and regression tests reject undocumented public GET/POST routes outside the test-only namespace. Independent API, developer-experience, and QA reviews found and resolved polymorphic response schemas, token-name constraints, palette count validation, stale examples, explorer ref rendering, and CORS error coverage.

**DOCUMENTATION UPDATES:** Keep README concise and link the API/package reference and examples.

**GIT CHECKPOINT:** Documentation/spec checkpoint after contract review.

**DEFINITION OF DONE:** A developer can discover and accurately call every public API operation from docs, and OpenAPI is the single machine-readable contract.

## Phase 9 — CI, production build, dependency hygiene, and release checks

**OBJECTIVE:** Make quality checks repeatable and release artifacts trustworthy without oversized infrastructure.

**STATUS:** COMPLETE

**DEPENDENCIES:** Phases 2–8.

**TASK CHECKLIST:**

- [x] Add GitHub Actions CI using clean install, tests, typecheck, build, package consumer check, and OpenAPI contract validation.
- [x] Pin/document supported Node LTS versions and run matrix only where package support warrants it.
- [x] Separate production server/package outputs and ensure generated files are ignored/handled intentionally.
- [x] Stage the publishable package with dependency-free metadata and verify the actual tarball in isolated ESM and TypeScript consumers.
- [x] Add dependency update/security review automation; do not make unstable external audit feeds a flaky PR gate.
- [x] Add release smoke workflow for built artifact and deployment health.
- [x] Establish measured basic API/package performance baselines and set limits only from evidence.
- [x] Add optional lightweight pre-release concurrent smoke test; no permanent load framework unless targets require it.
- [x] Review secrets/log redaction and npm publish provenance/permissions if supported by selected release flow.

**SUBAGENTS TO USE:** Security/reliability reviewer; QA/CI reviewer; package release reviewer.

**SKILLS TO USE:** None presently relevant; inspect a provider/release skill only if one is selected and available.

**TESTS REQUIRED:** CI pipeline itself on clean checkout, production artifact import, actual packed-tarball ESM and declaration consumer, tests/typecheck/build, OpenAPI validation, package contents, smoke script.

**VERIFICATION COMMANDS:** `npm ci` (107 packages, 0 vulnerabilities); `npm test` (224 tests, 14 files); `npm run typecheck`; `npm run build`; `npm run openapi:check` (20 operations); `npm run package:types`; `npm run package:smoke`; `npm run package:stage`; `npm run package:contents` (19 files, 23,225 packed / 87,717 unpacked bytes); `npm run package:tarball-smoke` (actual tarball ESM import and declaration compile, no Fastify dependency); `npm run release:stage`; `npm run release:smoke` (production-only install and 20 concurrent requests); `npm run perf:baseline`; `npm audit --omit=dev` (0 vulnerabilities); `git diff --check`. Local verification ran on Node v22.16.0/win32-x64. Baseline: Intel i5-1135G7, 20 warmups/250 sequential samples, package `convertColor` p50 0.046 ms/p95 0.086 ms/max 0.260 ms; loopback API p50 2.405 ms/p95 4.038 ms/max 12.562 ms, 371.51 requests/s. This is a local informational baseline, not a service guarantee or CI threshold.

**DOCUMENTATION UPDATES:** README and architecture document Node 22/24 support, clean CI checks, weekly Dependabot updates, separate server/package outputs and manifests, actual tarball consumer verification, production-only server dependency install and smoke. This task record includes the measured non-gating local baseline.

**GIT CHECKPOINT:** Focused CI and release hygiene checkpoint committed after independent review and complete diff inspection.

**DEFINITION OF DONE:** A clean checkout reproduces all required checks, consumes the actual packed package tarball as a Node and TypeScript consumer, and produces a verified production bundle. The server bundle passes health, representative endpoint, safe-error, log-canary, and concurrent-request smoke checks; uploaded artifact excludes installed dependencies and includes the lockfile for reproducible production installation. Independent security, QA, and package reviews found no remaining blockers; checkpoint is recorded after final diff review.

## Phase 10 — Host selection and public API deployment

**OBJECTIVE:** Select a suitable host at execution time, deploy the API, and prove the public endpoint works.

**STATUS:** COMPLETE — 2026-10-04

**DEPENDENCIES:** Phases 7–9.

**TASK CHECKLIST:**

- [x] Compare Cloud Run, Render, and Railway against cost, simplicity, regional availability, environment/secrets, logs, rate limiting, and health checks.
- [x] Select Render for the low-traffic initial release; Frankfurt is the nearest listed region. Keep the prepared Cloud Run option documented and its Docker assets intact.
- [x] Add a Render Blueprint that uses the existing production Docker build/start path, health endpoint, one free instance, and the explicit 120-per-minute process limiter.
- [x] Accept free-tier spin-down/cold starts for the initial public/portfolio release; document always-on upgrade as the next step if real usage justifies it.
- [x] Configure `CF-Connecting-IP` as the Render edge client-IP input for the existing limiter per provider guidance; retain socket-IP fallback and document that `X-Forwarded-For` is caller-spoofable. The live forged-header probe was rejected by Cloudflare before forwarding.
- [x] Document Render environment defaults, manual dashboard tasks, plan/cost, CORS allowlist setup, TLS/custom domain, logs, and rollback without credentials.
- [x] Configure the Blueprint environment values without committing credentials; the API requires no application secrets.
- [x] Deploy the production build to `https://color-api-9qdz.onrender.com`; the default Render hostname is the initial public URL, so no custom domain is required.
- [x] Reach public `/health`, OpenAPI, and docs; live-smoke conversion, alpha, accessibility, batch, and safe error operations.
- [x] Check CORS, rate limiting, body limits, request IDs, and payload-safe application logging. No browser origins are configured; unapproved origins are denied. Render dashboard logs were not directly accessible, so logging was verified from the deployed source behavior and production-bundle canary smoke.
- [x] Record rollback/redeploy instructions and operational limits in `docs/deployment.md`.

**SUBAGENTS TO USE:** Security/reliability reviewer; deployment reviewer; independent public API smoke tester.

**SKILLS TO USE:** Apply the selected provider’s relevant skill only if available. Sites hosting is not applicable unless the deployment is a Sites-hosted website.

**TESTS REQUIRED:** Local production smoke plus live public HTTP smoke and bounded concurrent check; verify actual response URLs/statuses.

**VERIFICATION COMMANDS:** `npm test`; `npm run typecheck`; `npm run build`; `npm run openapi:check` (20 operations); `npm run release:smoke` locally and with `PUBLIC_API_URL=https://color-api-9qdz.onrender.com`; Render Blueprint YAML parsed and free-plan/port/health/rate-limit settings asserted with the repository's `js-yaml`; `git diff --check`. Live checks verified health, OpenAPI/docs, representative operations, 20 concurrent conversions, safe validation/transport errors, 65,536-byte body limit, request IDs, CORS denial/default behavior, the 120-per-minute `429`, HTTPS redirect, and Cloudflare rejection of a forged `CF-Connecting-IP`. Docker image smoke is wired into CI but could not run locally because Docker is not installed. The live response did not include common browser security headers; see deployment notes.

**DOCUMENTATION UPDATES:** Publish API URL, environment/deploy instructions, limits, and incident/rollback steps.

**GIT CHECKPOINT:** Render deployment-preparation checkpoint `8dae17f` is preserved; this verified production URL and status update is the focused Phase 10 completion checkpoint. The Cloud Run preparation checkpoint `ad6e12d` is also preserved. No credentials in Git. Do not push automatically.

**DEFINITION OF DONE:** Complete. The public API is reachable at its real HTTPS URL and representative endpoints, operational limits, and transport errors passed live smoke checks. See `docs/deployment.md` for observed CORS/security-header/logging limitations and rollback guidance.

## Phase 11 — Final independent QA, package publication, and public release

**OBJECTIVE:** Verify cross-surface parity and release the package/API only after all prior definitions of done pass.

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phases 0–10.

**TASK CHECKLIST:**

- [ ] Run all checks from a clean checkout and inspect full Git diff/status.
- [ ] Independently audit reference vectors, alpha, gamut, WCAG claims, HTTP errors, OpenAPI parity, and package exports.
- [ ] Verify README/API/package examples against built package and public API.
- [ ] Confirm public API deployment smoke test results and production limits.
- [ ] Confirm package name, version, license, provenance/permissions, and publish credentials with user only where required.
- [ ] Publish npm package if authorization and credentials are available; verify install/import from the published artifact.
- [ ] Record changelog/release notes and ensure Git state is clean except intentional release artifacts.
- [ ] Update `task.md` statuses and close deferred items accurately.

**SUBAGENTS TO USE:** Independent color science, API, security, package, DX, and QA reviewers; lead resolves findings.

**SKILLS TO USE:** Relevant package publishing/release skill if available at execution time.

**TESTS REQUIRED:** Full unit/route/package/browser suite, CI, production build, deployed API smoke, public package consumer smoke.

**VERIFICATION COMMANDS:** `npm ci`; `npm test`; `npm run typecheck`; `npm run build`; `npm pack --dry-run`; live API `curl` smoke; published package consumer install/import.

**DOCUMENTATION UPDATES:** Changelog, package/API release versions and public URLs, remaining NEXT/FUTURE items.

**GIT CHECKPOINT:** Final reviewed release checkpoint; lead agent only performs Git mutations.

**DEFINITION OF DONE:** API is deployed and smoke-tested publicly; package is publicly installable if authorized; CI is green; package/API docs match actual behavior; no unresolved release-blocking review finding remains.

## Future work — website and AI

**OBJECTIVE:** Keep future projects enabled without expanding this cycle.

**STATUS:** FUTURE

**DEPENDENCIES:** Public package/API release.

**TASK CHECKLIST:**

- [ ] Website: build a separate visual product consuming the browser-tested package and public API.
- [ ] Website tools: conversion, generation, palettes/scales, accessibility, analysis, manipulation, design tokens, docs, playground.
- [ ] AI: define validated operation-plan schema and privacy/cost policy before any provider integration.
- [ ] AI: ensure model output only selects deterministic engine operations and verified results.
- [ ] Persistence: design separately only if website use cases require saved projects/accounts/sharing.

**SUBAGENTS TO USE:** Product, website, AI safety/architecture, and DX reviewers at that future mission.

**SKILLS TO USE:** Use relevant Sites/Figma/AI integration skills only when those products are explicitly in scope.

**TESTS REQUIRED:** To be planned at future mission start.

**VERIFICATION COMMANDS:** To be planned at future mission start.

**DOCUMENTATION UPDATES:** Create future project plan without expanding core docs with speculative implementation details.

**GIT CHECKPOINT:** Separate project/release checkpoints.

**DEFINITION OF DONE:** Future work remains outside the stateless deterministic engine until separately authorized and planned.
