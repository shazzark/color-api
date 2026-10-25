# ChromaForge website implementation plan

**Status: Phases 12–15 complete; Phase 16 implementation is complete with exact-origin CORS and live browser verification pending; Phase 17A CI/origin hardening is authorized locally; Phase 17B deployment remains unauthorized.**

## Phase 12 — Product and architecture planning (complete)

**Objective:** Prepare website scope and decisions for review without coding.

**Deliverables:** MVP scope, website PRD, TRD, app flow, architecture,
design-system proposal, capability map, implementation plan, and task checklist
in this folder.

**Acceptance:** Each requested MVP feature maps to an existing package export
or API operation in [capability-map.md](capability-map.md); unsupported claims
and open decisions are explicit; current package/API phases remain unchanged;
the product owner approves the scope and architecture.

**Verification:** Read-only package/route/OpenAPI inventory, document/link
review, and scope consistency review. No app tests/build apply to planning.

**Definition of done:** Planning package is reviewed and approved. No website
implementation phase is marked complete by this planning phase.

## Phase 13 — Isolated web foundation and shell (complete)

**Objective:** Create the `web/` Next.js App Router application and core shell.

**Scope:** Separate manifest/lock/config; Tailwind tokens and themes; shared
navigation, responsive layout, error/not-found boundaries; route skeletons;
package/API release-status content; static export proof; web-only CI commands.

**Dependencies:** Approved Phase 12 scope/architecture and explicit Phase 13
authorization. Production domain selection is deferred to Phase 17; API status
messaging is approved as pre-release.

**Acceptance:** Root package/API scripts and package contents remain unchanged;
web app installs/builds independently; all routes render in light/dark modes;
responsive navigation is keyboard-operable; no authentication, database, API
proxy, or runtime secrets are introduced.

**Verification:** Isolated dependency install, lint/typecheck, unit/component
tests, production static build and preview; keyboard, reflow, and theme smoke
checks.

**Result:** Implemented under `web/` with an independent manifest and lockfile.
Next.js static export generated 15 routes. Isolated typecheck, lint, and build
passed. Five Chromium Playwright scenarios passed, covering route states,
keyboard-operated mobile navigation, theme persistence, responsive overflow at
320/390/768/1280px, and homepage axe checks. The Playwright CLI remained alive
after reporting all five tests as passed on Windows and was stopped after test
completion. A later clean `npm ci` attempt did not return a completion result;
the earlier isolated `npm install` completed and the final installed tree built
successfully. Root `npm test` passed all 226 tests with a 20-second CLI
timeout after the default 5-second timeout proved too short for the OpenAPI
example test in this environment; root typecheck, build, and OpenAPI check
passed.
Independent review found no blocking issues. The production hostname is to be
assigned by Vercel; exact-origin API CORS and browser integration verification
are Phase 16 acceptance work. Website deployment and launch are Phase 17 work.

**Definition of done:** COMPLETE. Phase 13 was recorded in local commit after
review; Phases 14–17 remain unauthorized.

## Phase 14 — Local color tools

**Objective:** Deliver converter, generator/manipulation, palette, and scale
journeys using the published package.

**Scope:** `web/features/{convert,generate,manipulate,palettes,scales}` and shared color
input/swatch/result/copy components; package calls through public exports only.

**Dependencies:** Phase 13 foundation and published `chromaforge@1.0.1`.

**Acceptance:** Six formats and alpha round-trip/canonicalization reflect the
package; seeded output is reproducible and unseeded output is labelled;
supported manipulation/palette/scale constraints are exposed accurately;
copy and error feedback work; no duplicate color implementation exists.

**Verification:** Focused package-parity component tests; browser journeys for
valid/invalid input, gamut metadata, alpha, seeds, responsive controls, and
copy fallback.

**Result:** Implemented all five local tools at `/tools/{convert,generate,
manipulate,palettes,scales}` using `chromaforge@1.0.1` public exports. The
converter exposes all six package formats. Generation, nine manipulation
operations, all six HSL harmony strategies, shades/tints/tones, and stop-based
OKLCH scales call the package directly. Shared input validation, previews,
copy feedback, and result/error components remain inside `web/features/`.
Supported gamut metadata is surfaced; mix and encoded-sRGB source-over
compositing remain distinct. The static export now includes the same tool
routes, and the homepage/navigation identify only these five routes as
available.

**Verification:** Web typecheck, lint, production static build, and all 11
Chromium Playwright tests passed. The browser suite covered converter formats,
alpha, invalid values, copying, seeded/unseeded generation, manipulation,
palette methods, scales, keyboard focus, responsive behavior at
320/390/768/1280px, and axe scans for all five tools in both light and dark
themes. It captured actual screenshots in `web/test-results/` (ignored by
Git). Static-export Playwright serving now exits reliably after the tests.
Root `npm test -- --testTimeout=20000` passed all 226 tests across 14 files;
root typecheck, build, and the 20-operation OpenAPI check passed. The default
web clean install could not be verified in this network-restricted Windows
environment: npm `ci` reached a registry request for `eslint` and failed with
`EACCES`, alongside the pre-existing ESLint peer-range warning. A local
legacy-peer-resolution `npm ci` restored the locked dependencies and all web
checks passed afterward. No package/API source or release behavior changed.

**Independent review:** No confirmed package/API misuse, duplicated color
math, static export issue, or unrelated root changes. A list-semantic issue in
manipulation results was found and fixed before final verification.

**Definition of done:** COMPLETE after focused local checkpoint. Phases 15–17
remain unauthorized.

## Phase 15 — Accessibility, analysis, and token tools

**Objective:** Complete the requested in-browser design evaluation/export
journeys.

**Scope:** `web/features/{contrast,analyze,tokens}` including explicit
compositing context, metrics, suggestions, token validation, and supported
serializers.

**Dependencies:** Phases 13–14.

**Acceptance:** WCAG results identify criterion/pair/context and measured
effective colors; transparency requires sufficient backdrop data; no broad
accessibility claim; deltaEOK is labeled without an invented universal
threshold; serializers match package output and unsafe names are rejected.

**Verification:** Component tests against package vectors/results; accessibility
and keyboard checks for forms/results; browser tests for export and failures.

**Result:** Implemented `/tools/contrast`, `/tools/analyze`, and `/tools/tokens`
using only `chromaforge@1.0.1` exports. Contrast includes sample-text and
non-text interface-boundary previews, criterion-scoped results, raw and
displayed ratios, effective composited colors, explicit opaque-canvas
handling, and pair-scoped package suggestions. Analysis
displays package luminance/classification and available OKLCH/HSL/HSV metrics;
optional `deltaEOK` is described as a distance without a universal threshold.
Token export supports the package's versioned JSON, CSS variables, JavaScript,
TypeScript, SCSS, and Tailwind color-data formats with package name validation,
copy, and a client-side download. No persistence or backend was added.

**Package calls:** Contrast uses `analyzeContrast` and
`suggestContrastingColors`; analysis uses `analyzeColor` and `deltaEOK`; token
creation uses `validateTokenName`, `createToken`, and `createColorObject`.
Serializers use `serializeDesignTokens`, `createCssVariablesBlock`,
`serializeJavaScriptObject`, `serializeTypeScriptObject`,
`serializeScssVariables`, and `createTailwindColorData`.

**Verification:** Web lint, typecheck, static production build, all 16 Chromium
Playwright tests, browser tool journeys, keyboard form/action operation,
copy/download, validation/reset, axe
scans in both themes, and responsive overflow checks at 320/390/768/1280px
passed. Root typecheck, build, and 20-operation OpenAPI verification passed.
The first root Vitest run had 225/226 pass because an existing 5-second
OpenAPI-example test timed out while root checks and web checks ran concurrently;
a serial rerun passed all 226 tests across 14 files. The bounded offline web
`npm ci --dry-run` did not install or change dependencies: npm reported the
existing ESLint 10 / `eslint-plugin-import` peer-range warning, then stopped
with `ENOTCACHED` because the ESLint registry manifest is absent from cache.
This does not establish a lockfile defect; the earlier standard clean install
failure remains an environment/network limitation. Browser coverage ran in
Chromium; automated axe results do not establish full WCAG conformance.

**Definition of done:** COMPLETE after browser tests, root tests, independent
review, final diff inspection, and focused local checkpoint. Phases 16–17
remain unauthorized.

## Phase 16 — API reference, package docs, and playground (implementation complete; live integration pending)

**Objective:** Make the existing package and HTTP contract easy to discover and
try without altering either contract.

**Scope:** `web/features/{playground,docs}`, OpenAPI-backed operation index,
request editor, fixed-origin client, safe result rendering, package install and
integration guides, curl/fetch snippets, pre-release API label.

**Dependencies:** Phase 13; API origin and CORS plan; decision on API pre-release
launch messaging.

**Acceptance:** All documented OpenAPI operations are discoverable in the
reference; the playground editor sends only documented `/v1` operations;
requests target only configured ChromaForge API; explicit Send/cancel/timeout
and safe error states work; examples validate against current package/API
docs; CORS is configured for the exact assigned HTTPS production origin before
live browser smoke. Implementation and mocked browser checks pass; exact-origin
CORS and live browser-to-API evidence remain outstanding.

**Verification:** Contract/example checks; mocked timeout/error cases; browser
smoke against a controlled API test instance; authorized live public smoke
only after release approval.

## Phase 17A — CI hardening and release readiness (local only)

**Objective:** Add a repeatable web CI gate and make static API-origin selection
safe before deployment work starts.

**Scope:** GitHub Actions web checks, fail-closed API-origin validation,
playground destination safeguards, dependency/install investigation, and
deployment preparation documentation.

**Acceptance:** Keep root package/API CI behavior unchanged; web CI installs
from its lockfile, runs on a supported Node release, typechecks, lints, builds
once, and propagates Playwright failures. Missing/empty configuration disables
the playground, hosted requests require the approved HTTPS API origin, and
development-only loopback is the sole local exception. No provider state,
production configuration, package behavior, or `/v1` release label changes.

**Verification:** root tests/typecheck/build/OpenAPI, web typecheck/lint/build/
Playwright, clean install and dependency-tree review, workflow review, and
`git diff --check`. Record results in [tasks.md](tasks.md).

**Dependency finding:** ESLint 10.13.0 is current, but some plugins transitively
included by `eslint-config-next@16.4.3` still declare ESLint 9 as their maximum
peer. This is a real metadata compatibility warning distinct from registry
access failures. Use standard `npm ci`; add no legacy peer flag unless its need
is proven by a clean supported environment. Revisit when upstream plugin peer
ranges and runtime compatibility are updated.

**Definition of done:** local checks, independent security review, final diff,
focused commits, and local/remote comparison are recorded. No deployment.

**Result:** The web CI job uses Node 24, the separate web lockfile, standard
`npm ci`, Chromium, typecheck, lint, and one build-plus-browser-test command;
the root Node 22/24 matrix and checks are unchanged. ESLint 10.13 installs
without a legacy flag and lint passes, but `npm ci` warns and `npm ls` reports
peer-range incompatibility in three plugins under `eslint-config-next`. ESLint
9 is end-of-life, so the workflow does not downgrade to it; track upstream
plugin compatibility. The lockfile’s platform-applicable dependency engines
permit Node 24. This Windows machine did not have Node 24 installed, making the
GitHub CI run the required first runtime proof.

The origin resolver now disables missing/blank settings, accepts the exact
Render HTTPS API origin for hosted builds, and permits loopback only in local
development. The client transport uses a constants-only module and requires
the environment when validating origins, so Preview/Production cannot send to
loopback. The static export remains at 15 routes. Configured Chromium tests
passed 25/25 with the offline-only case skipped; a separate offline export and
browser check passed 1/1 and observed disabled Send with no external request.
Root tests passed 226/226, typecheck/build/OpenAPI (20 operations)/package type
checks passed, workflow YAML parsed, and `git diff --check` passed. No API,
package calculation, CORS, production environment, or deployment state changed.

## Phase 17B — Release readiness and website launch (not authorized)

**Objective:** Verify accessible, performant, secure static output and deploy
the approved website.

**Scope:** Cross-browser and responsive verification, security-header and
content review, generated static artifact checks, hosting config, exact CORS
allow-list operations note, deployment and rollback documentation, release
smoke.

**Dependencies:** Phases 13–16; selected host/domain; approved API status and
origin; user authorization for external deployment.

**Acceptance:** P0 journeys pass; no critical/serious automated accessibility
issues; manual keyboard/screen-reader checklist passes; web performance targets
from TRD meet the recorded lab setup or are explicitly revised; static artifact
serves all routes/assets; production API preflight and playground smoke succeed;
no secrets/input logging/persistence; rollback instructions are exercised or
reviewed.

**Verification:** Web clean install/test/build, browser E2E across Chromium,
Firefox, and WebKit, Lighthouse/accessibility scan, deployed HTTPS/CORS/API
smoke, and final review of generated artifacts and Git diff.

**Definition of done:** Website MVP is publicly reachable and documented, all
approved journeys and release checks pass, and a focused Git checkpoint is
created only when the user authorizes the release/checkpoint actions.

See the [Phase 17 deployment runbook](deployment-runbook.md) for the proposed
Vercel settings, Render CORS change, smoke tests, push side effects, and
rollback steps. It is preparation only; no provider configuration was changed.
