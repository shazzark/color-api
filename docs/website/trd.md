# ChromaForge website technical requirements

**Status: approved Phase 12 technical baseline.** Verify exact framework/tool
versions and the proposed lab performance budgets during implementation.

## Application structure and runtime

- Use Next.js App Router and TypeScript in an isolated `web/` application.
- Keep root `package.json`, root lockfile, root TypeScript configs, package
  exports, Fastify routes, API semantics, and root build/release scripts
  unchanged.
- The web app owns its own `package.json`, lockfile, TypeScript, lint, test,
  and build configuration. Do not add root npm workspaces for MVP.
- Build documentation and marketing pages as static output where supported;
  use client components only for interactive tools, themes, clipboard, and API
  playground requests. Do not add route handlers solely to proxy public API
  requests.
- Import `chromaforge@1.0.1` via its public package export map. Do not import
  `../../src/color/*` or any unpublished internal path. Upgrade the package
  version only through normal release review.
- Set the API base URL through a build-time public configuration value with a
  safe production default. It must not contain credentials.
- Build the API reference from the repository OpenAPI artifact at build time
  (or a package-published artifact if a later release process provides one).
  Validate the document; do not maintain a second manually edited operation
  schema.

## Browser and API behavior

- Client-only color operations must match the package output and avoid
  reimplementing color transformations.
- API playground operations must be selected from the known OpenAPI document
  and sent only to the configured ChromaForge API origin. Do not accept an
  arbitrary target URL or expose a proxy that could become an SSRF path.
- Use JSON requests, bounded request timeout, AbortController cancellation,
  safe response parsing, and user-visible network/HTTP/validation failure
  states. Never render response strings as HTML.
- Configure the deployed API's existing `CORS_ORIGINS` with exact HTTPS site
  origins (production and any explicitly approved preview origin). No wildcard
  or credentialed CORS. Verify preflight and actual requests after deployment.
- The current API contract is documented as pre-release; show that status in
  playground and reference surfaces until the API release policy changes.

## Styling and component requirements

- Use Tailwind CSS for layout and utility styling, with semantic CSS custom
  properties as the design-token source. Avoid adding a second component
  library unless implementation demonstrates a concrete need.
- Keep token values and component states documented in
  [design system](design-system.md). Validate all text/control contrast pairs;
  generated user swatches are data, not UI state indicators.
- Keep feature-specific behavior in feature modules and shared primitives in
  a small UI layer; do not create an app-wide generic state framework.

## Security and privacy

- No auth, user database, secrets, cookies, or server-side storage in MVP.
- Treat user values and API responses as untrusted text. Use text rendering,
  constrained parsers, package validation, and existing safe serializers.
- Do not use `dangerouslySetInnerHTML` for tool values, API responses, Markdown,
  or OpenAPI descriptions without an audited sanitizer and an approved need.
- Do not log or persist color inputs, generated colors, API request bodies, or
  response bodies. Do not add analytics without explicit product/privacy
  approval.
- Copy/download actions remain user initiated. Bound counts, request sizes, and
  editable JSON using limits from the package/API contract.
- Review existing deployment header observations before launch; apply web
  security headers at the website host/CDN where appropriate. This does not
  silently change the existing API's behavior.

## Accessibility, compatibility, and performance

- Target WCAG 2.2 AA for the website UI. This is a target to verify, not a
  conformance claim based only on automated scans.
- Support keyboard-only operation, visible focus, labels/help/error
  association, logical landmarks/headings, status announcements, reduced
  motion, 200% zoom, and touch targets of at least 24 CSS px (44 px preferred
  for primary touch actions).
- Support responsive reflow from 320 CSS px through desktop; no horizontal
  page overflow for core journeys.
- Proposed lab release budgets: Lighthouse mobile accessibility score 100 and
  performance score at least 90 on representative static/tool routes; LCP
  under 2.5 s and CLS under 0.1 in the documented lab profile. Revisit budgets
  with a recorded baseline before treating them as an absolute release gate.
- Test the current supported browser set selected at implementation, including
  Chromium, Firefox, and WebKit engines; do not infer application compatibility
  solely from the package's existing Chrome smoke.

## Verification requirements

- Unit/component tests cover mapping, form behavior, package output display,
  error/empty/loading/success states, API transport, and theme behavior.
- Browser tests cover each core journey, keyboard operation, mobile reflow,
  clipboard fallback, API failure/timeout, and `/v1` pre-release labeling.
- Automated accessibility checks report zero critical/serious violations on
  representative pages; manually check keyboard flow and at least one
  screen-reader path per major interaction type.
- Isolated web install/build/test commands must work without changing the
  existing root package install/build/release contract.
