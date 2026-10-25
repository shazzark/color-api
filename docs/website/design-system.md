# ChromaForge website design system proposal

**Status: approved visual direction.** Candidate token values require measured
contrast verification before implementation; exact visual values are not
frozen by the Phase 12 approval.

## Direction from the frontend style library

The 25-style library treats styles, layout patterns, and surface treatments as
composable directions. The recommended combination is:

- **Primary: Swiss / International** — a disciplined grid and functional
  hierarchy suit reference material and repeated technical tasks.
- **Emphasis: Typography-Led** — strong editorial type makes product purpose,
  tool labels, and technical explanations easy to scan.
- **Accent: Playful, with a small Bauhaus influence** — color swatches and
  geometric marks can make the product feel specific and approachable while
  staying tied to actual color output.
- **Localized: Dark / Developer-Focused** — use denser dark treatment inside
  code/request/response panels, not as the entire site's only visual language.
- **Layout: asymmetric Swiss columns, not a generic Bento landing page.** Use
  one clear product statement, an actual interactive converter preview, and a
  compact operation index. Avoid decorative glass, giant gradient blobs,
  stock “AI” visuals, and card grids where every item has equal weight.

The alternatives were considered as combinations: Typography-Led alone can
become editorial without enough tool wayfinding; Playful/Illustrative across
every page risks crowding a developer tool; Dark/Developer-Focused throughout
can make package guides and broad product discovery feel unnecessarily dense.
Minimalist structure remains useful, while the Swiss grid keeps tool controls
and reference content aligned. Use playful geometric accents only where they
help identify real color operations.

## Identity and tone

- Wordmark: `ChromaForge`, set in a sturdy sans-serif; simple mark formed from
  three offset color chips/rectangles that also reads in monochrome.
- Positioning line: “Color operations, built on deterministic math.” Treat this
  as draft copy, not an approved brand claim.
- Voice: direct, precise, practical. Explain assumptions in plain English and
  label local package calculations versus remote API requests.
- Use actual generated/input swatches as the main color presence. Do not imply
  that a decorative brand color is an accessible UI color combination.

## Typography

- Display and UI: Geist Sans candidate (or `Inter` if already available and
  approved), with system UI fallback. Use a restrained weight range and clear
  heading scale.
- Code and color values: Geist Mono candidate (or system monospace fallback).
  Reserve monospace for code, hex/RGB values, seeds, and API payloads.
- Self-host any chosen font after verifying its license and build behavior;
  avoid a runtime third-party font request. Keep body copy comfortably sized
  and line lengths near 60–75 characters.

Phase 13 uses Geist Sans/Geist Mono and Inter as preferred installed-family
names with system UI and monospace fallbacks. It does not make external font
requests. No font files are bundled until their source and license are verified.

## Candidate semantic tokens

These establish a direction only; calculate and document WCAG contrast for
every text/control pairing during implementation.

| Token | Light candidate | Dark candidate | Use |
|---|---|---|---|
| `--cf-canvas` | `#F7F8F5` | `#111512` | Main page background |
| `--cf-surface` | `#FFFFFF` | `#1A201B` | Tool panels and navigation |
| `--cf-surface-muted` | `#ECEFEA` | `#242C26` | Secondary grouping |
| `--cf-ink` | `#18201A` | `#F2F5EF` | Primary text |
| `--cf-muted` | `#56615A` | `#B4BDB4` | Supporting text |
| `--cf-line` | `#D2D9D1` | `#3B463D` | Borders and separators |
| `--cf-brand` | `#3456D1` | `#AFC0FF` | Primary action/link; verify each pairing |
| `--cf-signal` | `#D9F36A` | `#D9F36A` | Small accent chip/selection accent, not small text |
| `--cf-success` | `#216B45` | `#77D7A1` | Status with text/icon label |
| `--cf-warning` | `#85520B` | `#F1C779` | Status with text/icon label |
| `--cf-danger` | `#B42318` | `#FF9B91` | Status with text/icon label |

Use tokens by meaning, not by raw color name. Tool swatches remain user data
with a visible border/checkerboard transparency background and adjacent text
values. Don't use only hue to convey selected, passing, or failed status.

## Layout and components

- Content max width around 1200 px; editorial text columns around 65–75ch.
- Desktop: top navigation, optional 224–256 px tool/docs rail, main task column,
  and a compact output/inspector column only where it improves the workflow.
- Tool canvas uses aligned form labels, constrained control widths, clear
  section headings, and a persistent result area; avoid oversized dashboards.
- Shared components: `SiteHeader`, `PrimaryNav`, `ToolNav`, `ThemeToggle`,
  `ColorInput`, `FormatSelect`, `ColorSwatch`, `FieldError`, `ResultPanel`,
  `CopyButton`, `StatusMessage`, `CodeBlock`, and `ApiRequestEditor`.
- Use semantic HTML buttons/inputs/selects. Add shared primitives for repeated
  accessible behavior, not a generic UI framework.
- Radius 8–12 px, thin explicit borders, minimal shadow. Use solid surfaces
  rather than glass effects.

## Responsive behavior

- 320–639 px: one column, top navigation menu, full-width form controls,
  outputs immediately below inputs, touch-friendly actions.
- 640–1023 px: two columns only when both controls and output remain usable;
  nav rail becomes collapsible.
- 1024 px and wider: stable rail and a wider work area; optional inspector
  panel for output/code.
- Reflow based on content fit, not device labels. Verify 200% zoom, long
  strings, browser text enlargement, and no page-level horizontal scrolling.

## Interaction and motion

- Immediate local calculation after valid input or explicit action where the
  operation is expensive/ambiguous. API playground always requires explicit
  Send and offers Cancel.
- Use short 120–180 ms opacity/color/border transitions for focus and state;
  never animate color indefinitely or rely on motion to explain a result.
- Honor `prefers-reduced-motion`; remove nonessential transitions/entrances.
- Keep focus visible. Menus manage focus and escape/restore behavior; status
  updates use live regions without unexpected focus movement.

## Accessibility and design QA

- Target WCAG 2.2 AA for the interface. Contrast calculator results remain
  scoped to the exact pair/context; passing application UI scans is separate
  from the website's own conformance review.
- Keyboard-operable controls, labels, error descriptions, focus order, heading
  hierarchy, non-color state cues, reduced motion, zoom/reflow, and visible
  focus are required.
- Check light/dark focus and disabled/error states as well as default states.
- Verify automated scan results and perform manual keyboard/screen-reader
  checks; automated tools alone do not establish conformance.
