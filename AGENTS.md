# Agent Instructions

## Project

Color API is a learning project for color validation and conversion. The current milestone supports health checks and HEX-to-RGB conversion only.

## Stack

- Node.js with TypeScript
- Fastify
- Vitest
- Native ES modules
- Strict TypeScript

## Architecture

- Keep HTTP concerns in `src/routes/`.
- Keep color types and conversion logic in `src/color/`.
- Keep conversion functions pure and independent of Fastify.
- Keep application construction in `src/app.ts` and server startup in `src/server.ts`.
- Do not add future features such as HSL, HSV, palettes, random colors, or contrast unless explicitly requested.

## Conventions

- Follow existing TypeScript formatting and naming.
- Preserve strict typing; do not use assertions merely to silence errors.
- Validate untrusted request data at runtime.
- Prefer small, focused modules and existing project patterns.
- Avoid unrelated refactors or behavior changes.

## Testing

- Add or update focused tests for behavior changes.
- Keep unit tests for color logic separate from endpoint tests.
- Vitest must use the configured `forks` pool.
- Run `npm test` after code changes.

## Dependencies

- Do not add dependencies unless they are necessary and justified.
- Prefer the Node.js and Fastify capabilities already in use.
- Never add a database for color conversion features unless explicitly requested.

## Verification

Before considering a change complete, run:

```bash
npm test
npm run typecheck
```

Run `npm run build` when build output or module configuration is affected.

## Git safety

- Do not commit, stage, reset, checkout, rebase, or force-push unless explicitly requested.
- Preserve existing user changes.
- Do not modify generated files or dependency lockfiles unless dependency changes require it.

## Agent workflow

Before modifying code:

1. Inspect the relevant files and current behavior.
2. State the intended changes briefly.
3. Make the smallest complete change.
4. Run the relevant verification commands.
5. Report changed files, checks performed, and any remaining manual review.
