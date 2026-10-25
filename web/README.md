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

`npm test` builds the static website and runs its Chromium Playwright suite. Install the
Playwright Chromium browser once with `npx playwright install chromium` if it
is not already available. The production build currently targets static export
to `out/`; retain that setting only while all approved routes remain compatible.
The full playground browser suite builds with the explicitly configured API
origin; Playwright intercepts its API requests. If that value is missing, the
playground is intentionally offline and its send-request scenarios cannot run.

## API playground origin

The static build reads `NEXT_PUBLIC_CHROMAFORGE_API_ORIGIN` at build time.
The value is public browser configuration and must never contain a secret.
Set it to `https://color-api-9qdz.onrender.com` only for a build that should
send playground requests. An unset, empty, or whitespace-only value disables
the playground request and generated URL. There is no production-origin
fallback. Development may use an explicitly configured loopback HTTP or HTTPS
origin; non-loopback API destinations are rejected.

Vercel Preview and Development builds should have this variable empty or
unset. Production should set the exact HTTPS API origin. Rebuild after changing
the value because static assets capture it during export.

Color tool routes are placeholders until their separately authorized phases.
The existing package/API behavior is not reimplemented or changed here.
