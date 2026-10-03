# Agent Instructions

## Project purpose

Color API provides a deterministic, stateless color engine through a reusable ESM package and a versioned Fastify REST API. Read `prd.md` for product scope, `architecture.md` for technical boundaries, and `task.md` for current phase/status before major work.

## Architecture boundaries

- Keep color math, validation, generation, analysis, accessibility, and serialization in framework-independent domain modules.
- Keep HTTP, rate limiting, CORS, request IDs, and transport errors in the Fastify adapter.
- Keep Fastify/server imports out of package exports. Package and API must call the same operations.
- Do not add website, AI, persistence, accounts, queues, or databases to the core unless the PRD is explicitly changed.
- Preserve explicit alpha, precision, gamut, compositing, and accessibility semantics. Never silently clip or claim broad accessibility from a single calculation.

## Implementation rules

- Inspect relevant source, tests, docs, and Git state before editing; preserve existing user changes.
- Follow strict TypeScript, discriminated color types, runtime validation, and existing naming/formatting patterns.
- Avoid unsafe type assertions, hidden side effects, duplicated color math, unnecessary abstractions, and unjustified dependencies.
- Keep package/browser code independent of Node-only and Fastify APIs; prove browser compatibility before documenting it.
- Update `prd.md` only for product scope decisions, `architecture.md` for technical decisions, `task.md` for progress/next work, and this file only for durable agent workflow rules.

## Required phase workflow

Follow:

`inspect → understand → plan → delegate where useful → implement → test → independent review → inspect Git diff → update documentation/task status → commit checkpoint → next phase`

- Use relevant specialist subagents throughout remaining phases (color science, product, API, package, security/reliability, DX, QA, deployment as applicable). Delegate read-only analysis when useful; subagents must not mutate Git.
- Discover and use relevant available skills for provider, publishing, or product-specific tool work. Do not invoke unrelated skills.
- The lead agent alone performs Git mutations. Never overwrite or discard user changes. Do not stage, commit, push, reset, checkout, rebase, or alter Git configuration unless the current task/phase explicitly authorizes it.
- Work in `task.md` phase order and do not advance past a failed definition of done.

## Tests and verification

- Add/update focused tests for behavior changes; prove contracts, not test count.
- Keep domain math tests separate from route tests. Include reference vectors and documented tolerances for color-space math.
- Test package consumers against built output; test actual browsers before claiming browser support.
- Test route limits, malformed requests, stable safe errors, CORS/rate policies, and package/API parity as applicable.
- Before a phase is complete, run `npm test`, `npm run typecheck`, and `npm run build`, plus that phase’s additional verification in `task.md`.
- Vitest must retain the configured `forks` pool.

## Review and definition of done

- An independent reviewer must inspect substantive math, API contracts, release/security behavior, and the final diff as applicable.
- Check the complete Git diff/status for accidental, generated, or unrelated changes before each checkpoint.
- Synchronize examples, API schemas, package types, OpenAPI, and docs with implemented behavior.
- A task/phase is complete only when its documented behavior, tests, verification, documentation, review, and Git checkpoint are complete. Public API release additionally requires a reachable public endpoint and successful smoke tests.
