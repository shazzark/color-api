# Phase 17 deployment runbook

**Status: preparation only.** No Vercel project, production hostname, Render
environment variable, GitHub setting, push, or deployment was changed while
writing this runbook. The `/v1` API remains pre-release. Phase 16 stays open
until the exact production origin is configured and a real browser completes
an API request successfully.

## Deployment shape

- Website: isolated static Next.js export from `web/`, hosted on Vercel.
- API: existing Docker Fastify service `color-api` on Render at
  `https://color-api-9qdz.onrender.com`.
- Browser requests go directly to the Render API. Do not add an API proxy,
  database, authentication, or a second color implementation.
- Initial website URL: the actual production `.vercel.app` hostname Vercel
  assigns. Do not substitute an invented hostname or configure a custom domain
  as part of the initial launch.

## Proposed Vercel project settings

Create one Vercel project connected to the existing GitHub repository
(`shazzark/color-api`) only when deployment is authorized. Use these settings:

| Setting | Proposed value |
| --- | --- |
| Framework preset | Next.js (auto-detected) |
| Production branch | `main` |
| Root directory | `web` |
| Include files outside root directory | Enabled. `web/lib/openapi-source.ts` reads the root `openapi.json` during the build. |
| Node.js | `24.x`, matching the root `.nvmrc` major and supported CI matrix |
| Install command | `npm ci --legacy-peer-deps --no-audit --no-fund` |
| Build command | `npm run build` |
| Output directory | Keep Vercel's Next.js framework detection. The repository sets `output: "export"` and `trailingSlash: true`; `next build` emits `web/out`. If Vercel requires an explicit static directory override, use `out` and verify all generated routes/assets before promotion. |
| Functions / server routes | None expected; this app is a static export. |

The install override matches the Phase 14 dependency-resolution mode recorded
in the website checklist. Do not add a root npm workspace or install the root
API dependencies into the Vercel project. Verify the platform's build logs
show the web lockfile was used and the exported route list is complete.

### Environment variables

These values are build-time configuration. `NEXT_PUBLIC_` values are compiled
into browser assets and are public; they are not secrets. Vercel applies
environment-variable edits to new deployments, not already-built deployments.

| Vercel environment | Variable | Value |
| --- | --- | --- |
| Production | `NEXT_PUBLIC_CHROMAFORGE_API_ORIGIN` | `https://color-api-9qdz.onrender.com` |
| Preview | `NEXT_PUBLIC_CHROMAFORGE_API_ORIGIN` | Empty string, so the playground disables Send. Verify the built preview reports no configured API origin. Do not allow dynamic preview hosts through production CORS. |
| Development | `NEXT_PUBLIC_CHROMAFORGE_API_ORIGIN` | Set an explicit empty string to disable playground calls; if omitted, the app falls back to the production Render origin. Set a local API origin only for an intentional local integration run. |

No API key or other secret is needed by the website. If Vercel does not retain
an empty Preview value as an empty string at build time, do not enable preview
API calls; make the preview origin unavailable or implement and verify an
explicit playground-disable setting before proceeding.

Use Vercel's assigned production `.vercel.app` hostname as the initial public
site hostname. Record the exact scheme and host from the project after its
first production deployment; that hostname is an external provider assignment,
not a value to guess in source or documentation.

## Existing Render API CORS change

The API parses `CORS_ORIGINS` as comma-separated exact HTTP(S) origins. The
current deployment notes report that no browser origins are configured. Once
the Vercel production hostname is assigned, add exactly this value to the
existing Render `color-api` service's environment:

```text
CORS_ORIGINS=https://<actual-assigned-production-host>.vercel.app
```

Replace the placeholder with the exact assigned origin. Do not include a path,
trailing slash, wildcard, credentials, or generated per-commit preview URL.
Preserve any already-approved origin if the Render dashboard shows one; first
record the current value, then append the production origin as a comma-separated
entry. The repository's `render.yaml` intentionally does not contain this
hostname because it is not known until Vercel assigns it.

The current Fastify adapter answers preflight with `204`, allows `GET, POST,
OPTIONS`, permits the `content-type` request header, exposes request/rate-limit
headers, and rejects a non-allow-listed origin with `403 CORS_ORIGIN_DENIED`.
It does not enable credentialed CORS. Keep those policies; do not disable CORS
or broaden the allow-list. A CORS environment change is a production Render
configuration change and causes a deploy when saved with deployment enabled.
It requires Render credentials and explicit authorization at execution time.

Do not add localhost to the production allow-list for local testing. For a
local web/API integration run, run the API separately with a local-only exact
origin such as `CORS_ORIGINS=http://127.0.0.1:3000`; keep that value out of the
Render production service.

## Ordered Phase 17 checklist

### Before any push or provider setup

- [ ] Review the complete commit range and final working tree. At this
  checkpoint `main` is locally ahead of cached `origin/main` by five commits;
  the Phase 16 commit will make it six. The five existing commits are the
  Phase 11 release record and website Phases 12–15.
- [ ] Fetch and inspect the live remote before pushing. The read-only
  `git ls-remote` check could not reach GitHub in the current network
  environment, so `origin/main` may have moved since the cached ref.
- [ ] Confirm the GitHub identity has repository write access and branch
  protection requirements are understood. Never force-push or rewrite history.
- [ ] Confirm CI passes on Node 22 and 24 for the exact commit range. The
  existing `.github/workflows/ci.yml` checks the root API/package only; it does
  not run the `web/` lint, typecheck, build, or Playwright suite. Add a web CI
  job or require and record equivalent checks before treating GitHub CI as a
  website release gate.
- [ ] Account for push-triggered side effects: Render's root `render.yaml`
  tracks `main` with `autoDeployTrigger: checksPass`, so a push can redeploy the
  existing API after CI. A Vercel project connected to `main` will also create
  deployments on pushes. Coordinate and authorize those provider actions
  before pushing.

### Vercel project and first deployment

- [ ] Create/import the Vercel project and verify the settings above, including
  outside-root file access for `openapi.json`.
- [ ] Set the Production API origin and empty Preview/Development values before
  building. Confirm the generated production page shows the expected API
  origin and a preview disables the Send button.
- [ ] Verify project deployment protection for Preview URLs. Production must
  be reachable at its assigned hostname for the live browser test; previews
  should remain protected and must not be allow-listed implicitly.
- [ ] Make the first production static deployment with the actual assigned
  Vercel hostname. This is externally visible, even if it is initially a
  technical verification and is not announced as a launch.
- [ ] Record the assigned hostname, deployment ID, source commit, build logs,
  static route list, and response-header results.

### Exact CORS and live Phase 16 integration

- [ ] Add the single exact production HTTPS origin to Render `CORS_ORIGINS`;
  preserve existing approved entries and record the before/after values.
- [ ] Let the API deploy complete and pass `/health`. Confirm Render reports
  the intended commit/configuration as live.
- [ ] In a real Chromium browser opened at the assigned Vercel production
  hostname, send one documented API operation. Confirm OPTIONS succeeds with
  the exact `Access-Control-Allow-Origin`, the POST goes to
  `https://color-api-9qdz.onrender.com/v1/...`, a safe response is rendered,
  and `x-request-id` is visible.
- [ ] Submit one invalid documented request and confirm the browser receives
  the API's safe 4xx JSON response. Confirm a redirect is rejected and no
  request is sent to a second host.
- [ ] Verify a preflight from one unapproved test origin does not receive an
  allow-origin header and is denied. Do not use a wildcard for this check.
- [ ] Record browser version, page origin, operation ID, status, response
  request ID, preflight result, timestamp, and deployment IDs without
  recording user payloads or credentials. Only then close the Phase 16 live
  integration acceptance item.

### Website launch readiness

- [ ] Smoke every static route directly, including `/`, all `/tools/*/`,
  `/docs/package/`, `/docs/api/`, and `/playground/`; verify CSS/JS assets,
  trailing-slash behavior, unknown-route 404, and no console/runtime errors.
- [ ] Verify HTTPS, response headers, preview protection, the `/v1` pre-release
  label, and the production API origin. Do not claim HSTS/CSP unless observed
  and configured; review CSP against Next static-export scripts before
  applying a restrictive policy.
- [ ] Run Phase 17's Chromium/Firefox/WebKit journey checks, keyboard and
  screen-reader review, accessibility scan, and the TRD performance profile.
  Automated axe output alone is not a WCAG conformance claim.
- [ ] Review the deployed static artifact, complete Git diff, Render/Vercel
  logs, and rollback targets. Obtain explicit approval before public launch or
  other externally visible promotion.

## Production smoke commands

After the API is healthy, use the existing bounded API release smoke against
the known Render origin:

```powershell
$env:PUBLIC_API_URL = "https://color-api-9qdz.onrender.com"
npm run release:smoke
```

This checks the deployed API contract, not browser CORS. Run the browser check
from the real Vercel production page as described above; a local mock or a
`curl` request cannot establish browser CORS behavior. Keep production requests
bounded to avoid triggering the per-process rate limit.

## Push, credentials, and externally visible actions

| Action | Credential / external effect |
| --- | --- |
| Local Phase 16 commit | Local Git only; authorized for this task. |
| `git fetch` / remote status check | GitHub network access; updates local remote-tracking refs only. |
| Push local commits to `main` | GitHub write access; publishes six commits relative to the cached remote and can trigger Render and Vercel deployments. Requires separate authorization. |
| Create/connect Vercel project or deploy | Vercel account/project access; creates provider resources and a publicly reachable deployment. Requires deployment authorization. |
| Set Production Vercel env | Vercel project access; affects a subsequent website build. The API origin is public configuration, not a secret. |
| Change Render `CORS_ORIGINS` | Render service access; changes production browser access and triggers/requires an API deploy. Requires separate authorization. |
| Production smoke | Public HTTPS requests; use bounded non-destructive calls. A real browser integration check requires the deployed hostname and the exact CORS change. |
| Rollback | Provider access; changes which deployment/config is serving traffic. Requires an incident/change decision. |

## Rollback and recovery

- **Vercel website:** use the dashboard's Instant Rollback to the last known
  good production deployment. Verify routes and assets afterward. A Vercel
  rollback does not restore newly edited environment variables, and values
  changed in project settings require a new deployment to take effect. Recheck
  the current API origin and preview settings after rollback.
- **Render API/CORS:** use the Render service Deploys page to roll back to the
  previous successful API deploy, or restore the recorded previous
  `CORS_ORIGINS` value and deploy. Render rollback disables auto-deploy in the
  dashboard; verify that state and only re-enable it after the cause is fixed.
  Confirm `/health`, CORS preflight, and the regular API smoke afterward.
- **Git:** do not reset or rewrite the local history. If a pushed commit caused
  a defect, use a reviewed revert commit after deciding how to coordinate the
  Render auto-deploy and Vercel production build.

The website is static and the API is stateless; there are no user records or
database migrations to restore. Environment and deployment configuration still
need explicit verification because a code rollback alone may not undo them.

## Provider references

- [Vercel monorepo root directories](https://vercel.com/docs/monorepos)
- [Vercel access to files outside the root](https://vercel.com/docs/monorepos/monorepo-faq)
- [Vercel build settings](https://vercel.com/docs/builds/configure-a-build)
- [Vercel environment variables and deployment scopes](https://vercel.com/docs/environment-variables)
- [Vercel supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel rollback](https://vercel.com/docs/instant-rollback)
- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [Render environment variables](https://render.com/docs/configure-environment-variables)
- [Render deploy behavior](https://render.com/docs/deploys)
- [Render rollback](https://render.com/docs/rollbacks)
