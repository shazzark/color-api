# ChromaForge website implementation plan

**Status: Phase 12 complete; Phase 13 authorized; Phases 14–17 proposed and not authorized.**

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

## Phase 13 — Isolated web foundation and shell

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

**Verification:** Clean isolated install, lint/typecheck, unit/component tests,
production static build and preview; keyboard, reflow, and theme smoke checks.

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

## Phase 16 — API reference, package docs, and playground

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
docs; CORS is configured for exact production origin before browser smoke.

**Verification:** Contract/example checks; mocked timeout/error cases; browser
smoke against a controlled API test instance; authorized live public smoke
only after release approval.

## Phase 17 — Release readiness and website launch

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
