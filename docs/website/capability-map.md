# Website capability to package/API map

**Status: approved map, verified against the current `src/index.ts`, route
registrations, and `openapi.json`; recheck on package/API changes.** The
package is the local computation source. The playground should execute only
versioned `/v1` operations. The reference may document all 20 OpenAPI
operations, including health/docs/spec GET operations.

| Website feature | Existing package exports | Existing API operations | Website behavior/limits |
|---|---|---|---|
| Homepage/product explanation | None; presentation only | None required | Explain package vs API and local vs network execution. |
| Converter | `convertColor`, `validateColor`, `normalizeColor`, `detectColorFormat` | `POST /v1/colors/convert`, `/v1/colors/validate`, `/v1/colors/normalize`, `/v1/colors/batch/convert` | Six formats only: HEX, RGB, HSL, HSV, OKLab, OKLCH, with existing alpha and gamut rules. |
| Generator | `generateColors` | `POST /v1/colors/generate` | Count and OKLCH constraints; distinguish `mulberry32-v1` seeded from `Math.random` output. Respect API count limit (1–100) for HTTP calls. |
| Manipulation | `rotateHue`, `adjustLightness`, `adjustChroma`, `adjustSaturation`, `adjustAlpha`, `grayscaleColor`, `invertColor`, `mixColors`, `compositeColors` | `POST /v1/colors/manipulate`, `/v1/colors/mix`, `/v1/colors/composite` | Mix and source-over composite are separate operations, spaces, and controls. |
| Palettes | `generateHslPalette`, `generateShades`, `generateTints`, `generateTones` | `POST /v1/colors/palette`, `/v1/colors/scales/variants` | HSL strategies: complementary, analogous, triadic, tetradic, split-complementary, monochromatic; configurable count only for analogous (2–12). |
| Color scales | `generateOklchScale` | `POST /v1/colors/scales/oklch` | Stop-based OKLCH scale; expose order, count, output format, and gamut metadata. |
| Contrast/accessibility | `analyzeContrast`, `getWcagResults`, `compositeColors`, `suggestContrastingColors`, `relativeLuminance`, `contrastRatio` | `POST /v1/colors/contrast`, `/v1/colors/contrast/suggestions`, `/v1/colors/composite` | WCAG 2.2 text and contextual non-text evaluation; sufficient backdrop context for transparency; report only the measured pair/criterion. |
| Analysis | `analyzeColor`, `relativeLuminance`, `contrastRatio`, `deltaEOK`, `analyzeContrast` | `POST /v1/colors/analyze`, `/v1/colors/distance`, `/v1/colors/contrast` | Present documented metrics; deltaEOK is a distance, not a universal pass/fail similarity threshold. |
| Design-token export | `createToken`, `createTokenResponse`, `createColorObject`, `createCssBlock`, `createCssVariableName`, `createCssVariablesBlock`, `createDesignTokenDocument`, `createScaleTokenMap`, `createTailwindColorData`, `formatCssColor`, `serializeDesignTokens`, `serializeJavaScriptObject`, `serializeScssVariables`, `serializeTypeScriptObject` | `POST /v1/colors/tokens`, `/v1/colors/tokens/serialize` | Expose supported serializer formats and safe token-name validation. No semantic role assignment. |
| API playground | Package runtime validation exports may validate local UI input; package functions are not the remote executor | All 17 `POST /v1/...` operations in OpenAPI | Fixed public API origin, documented `/v1` operations only, explicit send, timeout/cancel, safe output. Show pre-release status. |
| npm package guidance | Public package `chromaforge@1.0.1`; named exports above | Not applicable | Derive examples from actual exports and published README/changelog. |
| API reference/examples | Package exports and types | All 20 OpenAPI operations; `GET /openapi.json` and `GET /docs` expose the contract/reference | Reference all operations. `GET /health`, `/docs`, and `/openapi.json` are informative/reference operations, not color-tool POST requests. |
| Responsive navigation, themes, feedback | None; website UI only | None required | Website-owned presentation state; no package/API contract change. |

## Source-of-truth rules

- Package exports: `src/index.ts` and generated package declarations.
- HTTP operations and schemas: `src/openapi.ts`, generated `openapi.json`, and
  corresponding `src/routes/*.ts` registrations.
- If a website feature needs behavior absent from these sources, defer it or
  propose a separate package/API change. Do not add an implied capability to
  website copy.
