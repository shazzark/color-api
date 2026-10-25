# ChromaForge website phase checklist

**Status: Phases 12–14 complete.** Phases 15–17 remain proposed and
unauthorized. Work must stop at a failed phase definition of done.

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

## Phase 13 — Web foundation and shell (complete)

**Candidate files:** `web/package.json`, `web/package-lock.json`, `web/tsconfig.json`,
`web/next.config.*`, `web/postcss.config.*`, `web/app/**`, `web/components/**`,
`web/styles/**`, and web-specific CI configuration.

- [x] Add isolated Next.js App Router app with Tailwind and no root workspace.
- [x] Add tokenized light/dark themes, semantic shell, responsive nav, and
  feedback/error boundaries.
- [x] Prove root package/API source, manifest, lockfile, exports, and API
  behavior remain unchanged; root tests, typecheck, build, and OpenAPI check pass.
- [x] Add web-specific install/lint/typecheck/test/build commands.
- [x] Verify static output, theme persistence, keyboard navigation, responsive
  layout at 320/390/768/1280px, and homepage axe checks.

**Tests:** 5 Chromium Playwright scenarios cover homepage content, planned route
states, keyboard-opened mobile navigation, theme persistence, responsive
overflow, and homepage axe checks. Web typecheck, lint, and static production
build pass. All Playwright cases passed in the final serial-worker run; on this
Windows runner the CLI stayed alive after reporting all five results and was
stopped after test completion. A clean `npm ci` attempt did not return a
completion result; the earlier isolated `npm install` completed and the final
installed dependency tree passed the production build. Root `npm test` initially
exceeded the existing 5-second timeout for the OpenAPI example test; all 226
tests passed when rerun with a
20-second CLI timeout. Root test configuration and source were not changed.

**Risk controls:** separate manifest/lock, no root `package.json` changes,
no secrets, static-first rendering.

**Done when:** complete. Static export produced 15 routes; web typecheck, lint,
production build, browser scenarios, and root package/API verification passed.
The independent review found no blockers. The homepage screenshot is available
as a local review artifact at `web/phase13-homepage-desktop.png`.

## Phase 14 — Package-backed local tools (complete)

**Candidate files:** `web/features/convert/**`, `generate/**`, `manipulate/**`,
`palettes/**`, `scales/**`, shared `ColorInput`, `ColorResult`, `ColorResultList`,
copy/field controls, and focused browser tests.

- [x] Implement converter using public `convertColor`/validation exports for
  HEX, RGB, HSL, HSV, OKLab, and OKLCH input/output.
- [x] Implement generation using `generateColors` with seed/constraint status.
- [x] Implement supported manipulation, with mix and composite as distinct
  operations and controls.
- [x] Implement all six HSL harmony strategies and shades/tints/tones.
- [x] Implement stop-based OKLCH scales.
- [x] Add copy and recoverable input/output feedback.
- [x] Wire five Phase 14 routes as available while leaving Phase 15 routes
  explicitly planned.
- [x] Preserve static export and keep the website on the published package;
  root package/API source, manifests, exports, and behavior remain unchanged.

**Verification:** Web `npm ci --legacy-peer-deps --no-audit --no-fund
--prefer-offline` restored the locked 360-package tree in about three minutes;
web typecheck, lint, static production build, and 11 Chromium Playwright tests
passed. Browser coverage exercised all six conversion outputs, alpha, invalid
HEX, copy, seeded determinism, unseeded status, supported manipulation
operations, palette strategies/variants, scale generation/validation,
keyboard focus, and both themes. All five tool routes had no horizontal
overflow at 320/390/768/1280px and passed axe scans in light and dark themes.
The tests captured converter screenshots at all four viewport widths and in
both themes under ignored `web/test-results/` artifacts. The Playwright runner
exited with code 0; a 15-second idle shutdown in its static-export test server
lets its Windows child process close cleanly after the suite.

The default clean `npm ci --no-audit --no-fund --prefer-offline` did not
complete within the initial 90-second bound. A subsequent attempt ran for
about three minutes and failed with Windows `EACCES` while fetching the
`eslint` package manifest from `registry.npmjs.org`; npm also reported the
existing ESLint 10 / `eslint-plugin-import` peer-range mismatch. This was an
environment/network failure, not a source or lockfile edit. Dependencies were
restored using npm's legacy peer-resolution mode. No global packages changed.

Root package/API checks passed after the web work: 226 tests across 14 files
with the existing 20-second test timeout, typecheck, build, and OpenAPI check
(20 operations). Independent review found no confirmed package contract,
duplicate color math, static-export, or root API/package issues. The review
noted no blocker; Phase 14 axe coverage includes both themes on each active
tool route.

**Risk controls:** package is sole math source; constrain UI to actual
operation ranges; seeded/unseeded state must be explicit.

**Done when:** complete. All local tool journeys call the published package;
the frontend contains no color conversion, manipulation, palette, or scale
algorithm implementation.

## Phase 15 — Contrast, analysis, and tokens (not authorized; next phase)

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
