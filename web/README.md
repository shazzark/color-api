# ChromaForge website

This isolated Next.js App Router application is the Phase 13 foundation for
the ChromaForge website. It has its own dependencies and lockfile; the root
package and Fastify API remain independent.

## Development

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` runs the Phase 13 Playwright foundation checks. Install the
Playwright Chromium browser once with `npx playwright install chromium` if it
is not already available. The production build currently targets static export
to `out/`; retain that setting only while all approved routes remain compatible.

Color tool routes are placeholders until their separately authorized phases.
The existing package/API behavior is not reimplemented or changed here.
