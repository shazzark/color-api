# ChromaForge website app flow

**Status: approved Phase 12 information architecture and core journeys.**

## Information architecture

```text
Home
├── Tools
│   ├── Convert
│   ├── Generate
│   ├── Manipulate
│   ├── Palettes
│   ├── Scales
│   ├── Contrast and accessibility
│   ├── Analyze
│   └── Design tokens
├── API playground
├── Documentation
│   ├── npm package
│   ├── API reference
│   └── Integration examples
└── About / product status
```

Proposed route shape: `/`, `/tools/convert`, `/tools/generate`,
`/tools/manipulate`, `/tools/palettes`, `/tools/scales`, `/tools/contrast`,
`/tools/analyze`, `/tools/tokens`, `/playground`, `/docs/package`, `/docs/api`,
and `/about`. Keep route labels short and URLs stable; details are owned by the
implementation plan.

## Shared shell

- Desktop: compact top bar with brand, primary tool/docs links, theme toggle,
  and a restrained left navigation rail on tool/reference routes.
- Tablet: rail collapses to an accessible menu; keep current tool title and
  primary action visible.
- Mobile: single-column content and controls, menu button with focus handling,
  outputs inline after inputs, no hover-only actions or horizontal tool canvas.
- Every page has a skip link, one `main`, logical headings, breadcrumb or clear
  active navigation where useful, and a consistent feedback region.

## Journey state transitions

```text
Tool input → package validation → local package operation → result + metadata
                                      └→ recoverable field error
API operation → JSON edit → explicit Send → fixed-origin request
                                      ├→ response + status + request ID
                                      └→ timeout/network/safe API error
```

Local tool inputs remain in in-memory UI state unless a user explicitly copies
or downloads output. Reload clears them in MVP. Theme preference may be stored
locally. No user input is sent to the API except an explicit playground submit.

## Journey details

### Homepage to tool

1. Explain package vs API and local vs network execution.
2. Offer a direct converter action and links to other tool families.
3. Show supported formats and factual release status.

### Generator to export

1. Set count and optional seed/constraints.
2. Generate with `generateColors`; label seeded algorithm or unseeded mode.
3. Select outputs and continue to supported palette/scale operations.
4. Give token names, preview supported serializer formats, and copy/download.

### Contrast check

1. Enter foreground/background and optional canvas for transparent colors.
2. Choose WCAG 2.2 text or supported non-text criterion and context.
3. Present pair, effective colors, ratio, threshold result, and limitations.
4. If suggestions exist, show each measured candidate with its assumptions.

### API playground

1. Select an operation from the OpenAPI operation list.
2. Populate its documented example; permit JSON editing and local syntax checks.
3. Require explicit Send; show pending state and allow cancellation.
4. Show status, safe response body, request ID when returned, and recoverable
   error. Offer equivalent curl/fetch snippets; label API as pre-release.

## Feedback and focus

- Field validation appears beside the related control and is associated using
  `aria-describedby`; invalid fields use `aria-invalid`.
- Result refreshes use a polite live region; blocking errors use an announced
  error summary without stealing focus.
- Copy/download completion is announced. Clipboard denial shows selectable
  output text and preserves it for manual copying.
- API request pending state is visible and announced; Send cannot be repeated
  while a request is in flight. Cancellation restores the editable request.
