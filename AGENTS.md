# Agent Instructions

## Project

Color API is a learning project for color validation, conversion, contrast
analysis, deterministic palette generation, and developer-friendly color
tokens. Stage 6 is the current
milestone.

- `GET /health` provides a health check.
- `POST /v1/colors/convert` supports HEX, RGB, HSL, and HSV.
- All 12 directed conversions between the four supported formats are available.
- `POST /v1/colors/contrast` provides WCAG 2.x contrast analysis.
- `POST /v1/colors/palette` provides deterministic palettes using five fixed
	strategies.
- `POST /v1/colors/tokens` provides one-color CSS custom-property tokens.
- API errors use the stable codes `INVALID_REQUEST`, `INVALID_COLOR`, and
	`UNSUPPORTED_CONVERSION`.

## Stack

- Node.js with TypeScript
- Fastify
- Vitest
- Native ES modules
- Strict TypeScript

## Architecture

- Keep HTTP concerns in `src/routes/`.
- Keep color types in `src/color/types.ts`.
- Keep runtime validation in `src/color/validation.ts`.
- Keep pure conversion mathematics in `src/color/conversion.ts`.
- Keep pure contrast mathematics in `src/color/contrast.ts`.
- Keep pure palette mathematics in `src/color/palette.ts`.
- Keep pure token serialization in `src/color/tokens.ts`.
- Keep conversion functions pure and independent of Fastify.
- Use RGB as the canonical internal representation.
- Use HSL as the palette-generation space.
- Keep application construction in `src/app.ts` and server startup in `src/server.ts`.
- Use `convertColor()` as the canonical conversion dispatcher.
- Keep palette strategies explicit and small; do not introduce a registry or
	generic strategy abstraction.
- Keep token generation focused on one color; do not add palette integration,
	themes, aliases, or exporters.
- Do not add random palettes, custom palette controls, additional color spaces,
	databases, or unrelated features unless explicitly requested.

## Conventions

- Follow existing TypeScript formatting and naming.
- Preserve strict typing; do not use assertions merely to silence errors.
- Validate untrusted request data at runtime.
- Preserve the discriminated `ColorValue` and `ColorFormat` model.
- Keep RGB channels as integers from `0` through `255`.
- Keep HSL/HSV hue normalized to `0 <= h < 360`.
- Keep HSL/HSV output rounded to two decimal places.
- Keep generated HEX output canonical lowercase `#rrggbb`.
- Keep token names restricted to `^[a-z][a-z0-9-]*$` before CSS interpolation.
- Use browser-oriented CSS serialization; HSV structured values serialize as RGB
	CSS values because `hsv()` is not broadly supported by browsers.
- Prefer small, focused modules and existing project patterns.
- Avoid unrelated refactors or behavior changes.

## Testing

- Add or update focused tests for behavior changes.
- Keep conversion, contrast, and palette unit tests separate from endpoint tests.
- Test all 12 directed conversions and all five palette strategies.
- Test color validation independently.
- Test WCAG thresholds, palette hue wrapping, monochromatic boundaries, and
	fixed output lengths.
- Test token-name validation, deterministic CSS serialization, and HSV-to-RGB
	CSS output.
- Test stable API error codes and response envelopes.
- Vitest must use the configured `forks` pool.
- Run `npm test` after code changes.

## Dependencies

- Do not add dependencies unless they are necessary and justified.
- Prefer the Node.js and Fastify capabilities already in use.
- Keep color conversion, contrast, and palette mathematics dependency-free.
- Never add a database for color conversion features unless explicitly requested.

## Verification

Before considering a change complete, run:

```bash
npm test
npm run typecheck
npm run build
```

## Git safety

- Do not commit, stage, reset, checkout, rebase, or force-push unless explicitly requested.
- Preserve existing user changes.
- Do not modify generated files or dependency lockfiles unless dependency changes require it.

## Agent workflow

Before modifying code:

1. Inspect the relevant files and current behavior.
2. Identify the owning validation, conversion, contrast, palette, route, or test surface.
3. State the intended changes briefly.
4. Make the smallest complete change.
5. Run `npm test`, `npm run typecheck`, and `npm run build`.
6. Report changed files, checks performed, and any remaining manual review.
