# Color API Execution Plan

This is the execution source of truth. Work phase-by-phase, update checkboxes/status after review, and do not skip dependencies. `COMPLETE` means its definition of done and verification passed. A feature present in staged source is not a completed Git checkpoint until safely reviewed and recorded.

## Current baseline

- Existing core/API functionality: HEX/RGB/HSL/HSV validation and conversion, WCAG text contrast, five fixed palettes, one-color CSS tokens, health endpoint.
- Stage 7 batch conversion source/tests and related docs are staged. Treat as existing user work; do not recreate or overwrite it.
- Current tests are in nine files and cover existing conversion, contrast, palette, token, route, and batch behavior. Vitest uses `forks`.
- No package exports/declarations, OpenAPI, CI, public deployment, alpha, OKLab/OKLCH, scales, or expanded design outputs exist yet.
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

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phase 2.

**TASK CHECKLIST:**

- [ ] Implement deterministic alpha compositing with explicit opaque backdrop requirements and documented CSS-compatible model.
- [ ] Implement relative luminance and WCAG contrast using effective composited colors; evaluate thresholds before display rounding.
- [ ] Add normal/large text AA/AAA results and explicitly scoped non-text contrast evaluations.
- [ ] Add useful light/dark classification and hue/saturation/chroma metrics where defined.
- [ ] Add named perceptual color distance/similarity metric and document its limits.
- [ ] Add deterministic accessible foreground/background candidate search; verify candidates after gamut mapping/compositing.
- [ ] Include criteria, assumptions, effective colors, and measured ratios in all accessibility result models.
- [ ] Exclude broad “accessible palette” claims and keep APCA out of stable WCAG results.

**SUBAGENTS TO USE:** Color science/accessibility reviewer; product reviewer; independent QA reviewer.

**SKILLS TO USE:** None currently relevant.

**TESTS REQUIRED:** Published WCAG vectors, threshold boundaries, opaque and transparent compositing cases, missing backdrop errors, non-text criteria/exceptions in scope, gamut-mapped candidates, deterministic recommendations, distance vectors.

**VERIFICATION COMMANDS:** `npm test`; `npm run typecheck`; `npm run build`.

**DOCUMENTATION UPDATES:** Document evaluated criteria, thresholds, large-text assumptions, compositing, and limitations in API/package docs and `prd.md`.

**GIT CHECKPOINT:** Focused accessibility/analysis checkpoint after expert review.

**DEFINITION OF DONE:** Results can be traced to a stated criterion, input context, compositing result, and reproducible calculation; no generalized conformance claim is emitted.

## Phase 4 — Generation, manipulation, palettes, and perceptual scales

**OBJECTIVE:** Add deterministic operations useful for frontend and design-system work.

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phase 2; Phase 3 for accessibility-aware candidate checks.

**TASK CHECKLIST:**

- [ ] Implement seeded random color generation with documented/versioned PRNG and bounded constraints.
- [ ] Support multiple generated colors while preserving seed reproducibility and order.
- [ ] Define unseeded generation as explicitly nondeterministic.
- [ ] Implement hue rotation, lightness/chroma/saturation adjustment, grayscale, invert, and alpha adjustment with named operation spaces.
- [ ] Implement mix/interpolation and blend/compositing as distinct operations with explicit spaces and premultiplied-alpha behavior where needed.
- [ ] Expand harmony palettes with tetradic and configurable offsets/counts where meaningful.
- [ ] Implement monochromatic shades, tints, tones, and document differences/ordering.
- [ ] Implement configurable deterministic OKLCH scales with stop semantics, monotonicity, and gamut mapping.
- [ ] Keep simple fixed harmony strategies explicit; avoid registries and arbitrary plugin frameworks.

**SUBAGENTS TO USE:** Product reviewer; color-science reviewer; independent API usability reviewer.

**SKILLS TO USE:** None currently relevant.

**TESTS REQUIRED:** Seed reproducibility/version vectors; constraint bounds; palette hue wrapping/counts; exact stop/order behavior; OKLCH scale monotonicity and gamut boundaries; manipulation reference values; mixing and alpha edge cases.

**VERIFICATION COMMANDS:** `npm test`; `npm run typecheck`; `npm run build`.

**DOCUMENTATION UPDATES:** Add operation examples and mathematical semantics to package/API docs; update roadmap and API types.

**GIT CHECKPOINT:** Separate checkpoints for generation/manipulation and palette/scale if review size warrants.

**DEFINITION OF DONE:** Operations are deterministic when seeded, semantically explicit, bounded, and tested at boundaries and with reference values.

## Phase 5 — Multi-color design-system outputs

**OBJECTIVE:** Serialize tokens and generated scales into useful framework-light developer formats.

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phases 2–4.

**TASK CHECKLIST:**

- [ ] Preserve and generalize CSS custom-property serialization to ordered multi-color tokens/scales.
- [ ] Add structured JSON design-token output with a documented stable shape.
- [ ] Add JavaScript object and TypeScript-friendly typed object forms.
- [ ] Add simple Tailwind-compatible data/config output without Tailwind runtime/version coupling.
- [ ] Add SCSS variables only if the serializer stays small and safe.
- [ ] Validate token keys before CSS/SCSS interpolation and reject unsafe names.
- [ ] Evaluate light/dark theme generation using existing deterministic scales and contrast checks; defer automatic role assignment if it needs a large policy engine.
- [ ] Ensure serialization contains no hidden file or framework side effects.

**SUBAGENTS TO USE:** Developer-experience reviewer; package reviewer; security reviewer for serialization safety.

**SKILLS TO USE:** None presently relevant; do not invoke Figma/Sites skills for this backend-only serializer phase.

**TESTS REQUIRED:** Deterministic serializers, escaping/unsafe names, alpha output, ordering, JSON shape, typed-object compile fixture, Tailwind shape, scale outputs, theme contrast if theme generation is included.

**VERIFICATION COMMANDS:** `npm test`; `npm run typecheck`; `npm run build`.

**DOCUMENTATION UPDATES:** Add output schemas/examples and any deferred theme items to `prd.md`/`task.md`.

**GIT CHECKPOINT:** Focused serializer/output checkpoint.

**DEFINITION OF DONE:** Outputs are deterministic, safe, version-agnostic where promised, and usable without framework dependencies.

## Phase 6 — Public package build and browser compatibility

**OBJECTIVE:** Turn the pure engine into a consumable ESM package and verify built artifacts in Node and browsers.

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phases 1–5.

**TASK CHECKLIST:**

- [ ] Add public named-export barrel for domain functions and types only.
- [ ] Separate package TypeScript build from server/tests and emit declarations.
- [ ] Configure ESM exports, package files, Node engine range, metadata, and side-effect-free exports.
- [ ] Verify tree-shakeable module boundaries and absence of Fastify from package graph.
- [ ] Add built-output Node consumer tests and typed usage fixture.
- [ ] Add an actual browser compatibility test before claiming browser support.
- [ ] Inspect `npm pack --dry-run`, artifact file list, and size.
- [ ] Write package README/quickstart/examples and SemVer/changelog policy.
- [ ] Prepare npm publishing workflow; do not publish until release review and credentials/authorization.

**SUBAGENTS TO USE:** Package architecture reviewer; browser compatibility reviewer; independent consumer DX reviewer.

**SKILLS TO USE:** None presently relevant. If an npm/release integration skill becomes available and is relevant, inspect it before use.

**TESTS REQUIRED:** Public export contract, Node import, TypeScript declaration consumption, actual browser execution, package content/size inspection, no Fastify dependency leak.

**VERIFICATION COMMANDS:** `npm test`; `npm run typecheck`; `npm run build`; `npm pack --dry-run`.

**DOCUMENTATION UPDATES:** Package usage guide, supported runtimes, examples, versioning and release policy.

**GIT CHECKPOINT:** Package build/export checkpoint; public publication is a separate release action.

**DEFINITION OF DONE:** Built package is usable by supported Node consumers and verified in a browser environment, with only intended artifacts and complete declarations.

## Phase 7 — REST API parity and public hardening

**OBJECTIVE:** Expose approved engine functions as a coherent, safe, bounded public API.

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phases 1–6.

**TASK CHECKLIST:**

- [ ] Map package operations to justified versioned routes; do not add batch endpoints for symmetry alone.
- [ ] Make single conversion same-format requests normalize consistently with package and batch semantics.
- [ ] Define validation, normalize, generation, scales, manipulation, analysis, accessibility, token, and justified batch contracts.
- [ ] Centralize HTTP error mapping for domain errors, malformed JSON, unsupported media types, not found, oversized bodies, rate limits, and internal failures.
- [ ] Add request body, batch, generation, and output limits.
- [ ] Add anonymous configurable rate limiting at one trusted layer and document proxy/client IP assumptions.
- [ ] Add configurable browser CORS suitable for public website usage; no credentialed wildcard.
- [ ] Validate environment config and deployment-compatible host/port at startup.
- [ ] Add safe structured logging/request IDs and graceful SIGTERM/SIGINT close.
- [ ] Keep liveness and readiness semantics simple and accurate.
- [ ] Keep future API key/quota extension at HTTP boundary only.

**SUBAGENTS TO USE:** API architecture reviewer; security/reliability reviewer; independent penetration/input-boundary reviewer.

**SKILLS TO USE:** None currently relevant.

**TESTS REQUIRED:** Route parity with package, stable envelopes/status, malformed body/content type, 404, limits, CORS preflight/origins, rate limit, request IDs, safe internal errors, shutdown/config validation.

**VERIFICATION COMMANDS:** `npm test`; `npm run typecheck`; `npm run build`; local production-server smoke check.

**DOCUMENTATION UPDATES:** Update API examples, errors, limits, CORS/rate policy, health/readiness and configuration docs.

**GIT CHECKPOINT:** Route families may be separate focused commits; review contract consistency at each checkpoint.

**DEFINITION OF DONE:** API is a thin adapter over package behavior, bounded for anonymous public use, and consistent for all documented HTTP failures.

## Phase 8 — OpenAPI and developer documentation

**OBJECTIVE:** Make the package and REST API discoverable and contract-driven.

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phase 7 API contracts.

**TASK CHECKLIST:**

- [ ] Add OpenAPI 3 specification covering every public route/schema/error/limit.
- [ ] Ensure runtime route schemas and OpenAPI do not drift; add contract validation in CI.
- [ ] Add readable API reference and lightweight interactive Swagger UI or equivalent from the same spec.
- [ ] Add curl and JavaScript fetch examples plus package examples.
- [ ] Include complete request, success response, validation, error, alpha, gamut, and accessibility-context examples.
- [ ] Document API version/deprecation, anonymous limits, CORS, and local deployment use.
- [ ] Defer Postman collection.

**SUBAGENTS TO USE:** Developer-experience reviewer; API contract reviewer; QA reviewer.

**SKILLS TO USE:** None presently relevant.

**TESTS REQUIRED:** OpenAPI schema validation, route/spec contract check, documentation example smoke tests where practical.

**VERIFICATION COMMANDS:** `npm test`; `npm run typecheck`; `npm run build`; OpenAPI validation command documented by chosen tooling.

**DOCUMENTATION UPDATES:** Keep README concise and link the API/package reference and examples.

**GIT CHECKPOINT:** Documentation/spec checkpoint after contract review.

**DEFINITION OF DONE:** A developer can discover and accurately call every public API operation from docs, and OpenAPI is the single machine-readable contract.

## Phase 9 — CI, production build, dependency hygiene, and release checks

**OBJECTIVE:** Make quality checks repeatable and release artifacts trustworthy without oversized infrastructure.

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phases 2–8.

**TASK CHECKLIST:**

- [ ] Add GitHub Actions CI using clean install, tests, typecheck, build, package consumer check, and OpenAPI contract validation.
- [ ] Pin/document supported Node LTS versions and run matrix only where package support warrants it.
- [ ] Separate production server/package outputs and ensure generated files are ignored/handled intentionally.
- [ ] Add dependency update/security review automation; do not make unstable external audit feeds a flaky PR gate.
- [ ] Add release smoke workflow for built artifact and deployment health.
- [ ] Establish measured basic API/package performance baselines and set limits only from evidence.
- [ ] Add optional lightweight pre-release concurrent smoke test; no permanent load framework unless targets require it.
- [ ] Review secrets/log redaction and npm publish provenance/permissions if supported by selected release flow.

**SUBAGENTS TO USE:** Security/reliability reviewer; QA/CI reviewer; package release reviewer.

**SKILLS TO USE:** None presently relevant; inspect a provider/release skill only if one is selected and available.

**TESTS REQUIRED:** CI pipeline itself on clean checkout, production artifact import, tests/typecheck/build, OpenAPI validation, package contents, smoke script.

**VERIFICATION COMMANDS:** `npm ci`; `npm test`; `npm run typecheck`; `npm run build`; `npm pack --dry-run`.

**DOCUMENTATION UPDATES:** Document CI, Node support, dependency review, build and release checks.

**GIT CHECKPOINT:** Focused CI and release hygiene checkpoint.

**DEFINITION OF DONE:** A clean checkout can reproduce all required checks and produce a verified, bounded release artifact.

## Phase 10 — Host selection and public API deployment

**OBJECTIVE:** Select a suitable host at execution time, deploy the API, and prove the public endpoint works.

**STATUS:** NOT STARTED

**DEPENDENCIES:** Phases 7–9.

**TASK CHECKLIST:**

- [ ] Compare suitable Node/Fastify hosting options briefly against cost, simplicity, regional availability, environment/secrets, logs, rate limiting, and health checks.
- [ ] Recommend a provider; ask user only if account, credential, billing, or provider authorization is required.
- [ ] Keep application architecture portable; add provider-specific config only in deployment files/docs.
- [ ] Configure environment values/secrets without committing credentials.
- [ ] Deploy production build and configure custom API URL if available.
- [ ] Reach public `/health` (and readiness if implemented) and smoke-test representative conversion, alpha, accessibility, batch, and error operations.
- [ ] Check CORS/rate/body limits and confirm logs/request IDs without leaking payloads/secrets.
- [ ] Record rollback/redeploy instructions and operational limits.

**SUBAGENTS TO USE:** Security/reliability reviewer; deployment reviewer; independent public API smoke tester.

**SKILLS TO USE:** Apply the selected provider’s relevant skill only if available. Sites hosting is not applicable unless the deployment is a Sites-hosted website.

**TESTS REQUIRED:** Local production smoke plus live public HTTP smoke and bounded concurrent check; verify actual response URLs/statuses.

**VERIFICATION COMMANDS:** `npm run build`; production server smoke command; public `curl` checks recorded in deployment notes.

**DOCUMENTATION UPDATES:** Publish API URL, environment/deploy instructions, limits, and incident/rollback steps.

**GIT CHECKPOINT:** Deployment config/documentation checkpoint; no secret values in Git.

**DEFINITION OF DONE:** Public API is reachable at its real URL and representative endpoints pass smoke checks. “Deployment ready” alone does not complete this phase.

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
