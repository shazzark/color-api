# ChromaForge website phase checklist

**Status: Phase 12 approved and complete; Phase 13 authorized.** Phases 14–17
remain proposed and unauthorized. Work must stop at a failed phase definition
of done.

## Phase 12 — Planning handoff (complete)

- [x] Reinspect branch, working tree, current product docs, package exports,
  API routes, and OpenAPI contract.
- [x] Map the requested website tools to existing package/API surfaces and
  record unsupported/deferred behaviors in [capability-map.md](capability-map.md).
- [x] Compare in-repository, separate-repository, and workspace options.
- [x] Draft MVP scope, website PRD, TRD, app flow, architecture, design system,
  implementation phases, and task checklist.
- [x] Product owner approves MVP, visual direction, and API status
  messaging.
- [x] Product owner approves the app repository boundary and Vercel as the
  initial host.
- [x] Record that the website domain is unselected and that static export is
  conditional; neither blocks Phase 13.
- [x] Record Phase 13 implementation authorization; do not advance to Phases
  14–17.

## Phase 13 — Web foundation and shell (authorized; in progress)

**Candidate files:** `web/package.json`, `web/package-lock.json`, `web/tsconfig.json`,
`web/next.config.*`, `web/postcss.config.*`, `web/app/**`, `web/components/**`,
`web/styles/**`, and web-specific CI configuration.

- [ ] Add isolated Next.js App Router app with Tailwind and no root workspace.
- [ ] Add tokenized light/dark themes, semantic shell, responsive nav, and
  feedback/error boundaries.
- [ ] Prove root package/API build, package contents, and CI remain unchanged.
- [ ] Add web-specific install/lint/typecheck/test/build commands.
- [ ] Verify static output and responsive keyboard navigation.

**Tests:** shell/component tests, theme tests, route rendering, keyboard and
responsive smoke, independent production build.

**Risk controls:** separate manifest/lock, no root `package.json` changes,
no secrets, static-first rendering.

**Done when:** web app builds in isolation and the existing package/API
verification remains green.

## Phase 14 — Local tools (not started)

**Candidate files:** `web/features/convert/**`, `generate/**`, `manipulate/**`,
`palettes/**`, `scales/**`, shared `ColorInput`, `ColorSwatch`, `ResultPanel`,
and focused tests.

- [ ] Implement converter using public `convertColor`/validation exports.
- [ ] Implement generation using `generateColors` with seed/constraint status.
- [ ] Implement supported manipulation, with mix and composite as distinct
  operations and controls.
- [ ] Implement HSL harmony palettes and shades/tints/tones.
- [ ] Implement stop-based OKLCH scales.
- [ ] Add copy and recoverable input/output feedback.

**Tests:** package parity and boundaries, alpha/format/gamut outputs, seeds,
constraints/counts, invalid values, browser journeys and responsive layout.

**Risk controls:** package is sole math source; constrain UI to actual
operation ranges; seeded/unseeded state must be explicit.

**Done when:** all local tool journeys match package outputs with no duplicate
color logic.

## Phase 15 — Contrast, analysis, and tokens (not started)

**Candidate files:** `web/features/contrast/**`, `analyze/**`, `tokens/**`, and
tool-specific tests.

- [ ] Build criterion/context-aware contrast UI and backdrop/compositing input.
- [ ] Display deterministic suggestions with assumptions and measured ratios.
- [ ] Display analysis metrics and scoped deltaEOK output.
- [ ] Support existing validated token names and serializers.
- [ ] Copy/download output with accessible confirmation/fallback.

**Tests:** WCAG known vectors through package functions, transparent context,
candidate explanations, deltaEOK labeling, unsafe token names, serializer
parity, keyboard and screen reader feedback.

**Risk controls:** never label a whole palette or website accessible from one
pair result; preserve input on recoverable errors.

**Done when:** displayed results and exports match package contracts and all
assumptions are visible.

## Phase 16 — Documentation and API playground (not started)

**Candidate files:** `web/features/playground/**`, `web/features/docs/**`,
`web/lib/api-client/**`, OpenAPI-generated/validated metadata and tests.

- [ ] Generate operation index and request examples from OpenAPI.
- [ ] Build package quickstart and guide from existing public exports/docs.
- [ ] Build reference views for all documented OpenAPI operations and a JSON
  request editor for documented `/v1` operations only.
- [ ] Restrict requests to fixed API origin and known paths; require explicit
  send and support timeout/cancellation.
- [ ] Display pre-release status and copyable curl/fetch snippets.
- [ ] Configure exact-origin CORS for approved website origin before browser
  integration verification.

**Tests:** OpenAPI drift check, examples contract checks, no arbitrary URL,
network/timeout/error tests, safe rendering, integration smoke.

**Risk controls:** no API proxy, arbitrary host input, client-side secrets, or
unescaped response rendering.

**Done when:** users can safely try current documented `/v1` operations, all
documented OpenAPI operations are discoverable in the reference, and examples
remain contract-aligned.

## Phase 17 — Release readiness (not started)

**Candidate files:** web deployment config/workflow, `docs/website` release and
rollback notes, browser/E2E/a11y/performance checks.

- [ ] Confirm host/domain and public API status decision.
- [ ] Verify HTTPS, security headers, exact CORS origin, static route/assets,
  preview policy, and rollback.
- [ ] Run browser matrix, core journeys, accessibility checks, and performance
  lab profile from TRD.
- [ ] Inspect complete Git diff and generated artifacts.
- [ ] Obtain approval before deployment or public release.

**Tests:** clean web install, web lint/typecheck/tests/build, Chromium/Firefox/
WebKit E2E, automated and manual accessibility, live CORS/API smoke when
authorized.

**Risk controls:** no deployment before review/approval; no new backend or
database; preserve current API rate and trust assumptions.

**Done when:** all approved P0 criteria pass on the deployed website and the
release has a reviewed rollback path.
