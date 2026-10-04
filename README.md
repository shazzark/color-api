# Color API

A deterministic color engine and versioned Fastify API. The color math and
validation live in framework-independent domain modules shared by API routes.

## Supported conversions

The API provides:

- `GET /health`
- `POST /v1/colors/convert` for color conversion
- `POST /v1/colors/contrast` for WCAG 2.x contrast analysis
- `POST /v1/colors/palette` for deterministic palette generation
- `POST /v1/colors/tokens` for single-color CSS custom-property tokens
- `POST /v1/colors/batch/convert` for synchronous batch conversion

The engine accepts six tagged formats: `hex`, `rgb`, `hsl`, `hsv`, `oklab`,
and `oklch`. All six support alpha where structured, and HEX accepts six- or
eight-digit values (`#rrggbb` / `#rrggbbaa`). Conversion supports every pair;
same-format conversion performs canonical normalization. Opaque alpha is
omitted from structured output.

HSL/HSV and OKLab/OKLCH conversions preserve floating-point intermediates.
Public HSL/HSV values use two decimal places; OKLab/OKLCH and structured alpha
use four. sRGB-bounded targets use CSS Color 4 local-MINDE gamut mapping when
needed and return `gamutMapped` plus the `css-color-4-local-minde` identifier.

## Setup

```bash
npm install
npm run dev
```

The server listens on `http://127.0.0.1:3000` by default. Set `PORT` or
`HOST` to change the bind address.

## API examples

### Health check

```bash
curl http://127.0.0.1:3000/health
```

```json
{
  "status": "ok"
}
```

### Convert HEX to RGB

```bash
curl -X POST http://127.0.0.1:3000/v1/colors/convert \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"hex\",\"to\":\"rgb\",\"value\":\"#3498db\"}"
```

```json
{
  "input": {
    "format": "hex",
    "value": "#3498db"
  },
  "output": {
    "format": "rgb",
    "value": {
      "r": 52,
      "g": 152,
      "b": 219
    }
  },
  "gamutMapped": false
}
```

### Structured color input

HEX values are strings. RGB, HSL, HSV, OKLab, and OKLCH values are objects.
Alpha is the optional `alpha` property for structured formats:

```json
{
  "from": "rgb",
  "to": "hex",
  "value": {
    "r": 52,
    "g": 152,
    "b": 219
  }
}
```

```json
{
  "from": "hsl",
  "to": "rgb",
  "value": {
    "h": 204.07,
    "s": 69.87,
    "l": 53.14
  }
}
```

```json
{
  "from": "hsv",
  "to": "rgb",
  "value": {
    "h": 204.07,
    "s": 76.26,
    "v": 85.88
  }
}
```

### Convert HEX to HSL

Use `"to":"hsl"` to return hue, saturation, and lightness:

```json
{
  "input": {
    "format": "hex",
    "value": "#3498db"
  },
  "output": {
    "format": "hsl",
    "value": {
      "h": 204.07,
      "s": 69.87,
      "l": 53.14
    }
  }
}
```

### Convert HEX to HSV

Use `"to":"hsv"` to return hue, saturation, and value:

```json
{
  "input": {
    "format": "hex",
    "value": "#3498db"
  },
  "output": {
    "format": "hsv",
    "value": {
      "h": 204.07,
      "s": 76.26,
      "v": 85.88
    }
  }
}
```

### Analyze contrast

Use `POST /v1/colors/contrast` to analyze a foreground/background pair. Both
colors accept any supported format. `criterion` defaults to `wcag-2.2-1.4.3`;
set it to `wcag-2.2-1.4.11` for an explicitly named non-text object or
boundary. Set `textSize` to `large` only when the text meets WCAG's large-text
definition (at least 24 CSS px regular or about 18.67 CSS px bold).

```json
{
  "foreground": {
    "format": "hex",
    "value": "#ffffff"
  },
  "background": {
    "format": "rgb",
    "value": {
      "r": 0,
      "g": 0,
      "b": 0
    }
  },
  "criterion": "wcag-2.2-1.4.3",
  "textSize": "normal"
}
```

```json
{
  "foreground": {
    "format": "hex",
    "value": "#ffffff"
  },
  "background": {
    "format": "rgb",
    "value": {
      "r": 0,
      "g": 0,
      "b": 0
    }
  },
  "criterion": "wcag-2.2-1.4.3",
  "threshold": 4.5,
  "passesCriterion": true,
  "rawContrastRatio": 21,
  "compositing": "css-srgb-source-over",
  "effectiveForeground": { "format": "rgb", "value": { "r": 255, "g": 255, "b": 255 } },
  "effectiveBackground": { "format": "rgb", "value": { "r": 0, "g": 0, "b": 0 } },
  "contrastRatio": 21,
  "wcag": {
    "normalText": {
      "aa": true,
      "aaa": true
    },
    "largeText": {
      "aa": true,
      "aaa": true
    }
  }
}
```

## Value rules

- HEX accepts exactly six hexadecimal digits, with an optional leading `#`.
- RGB channels `r`, `g`, and `b` are integers from `0` through `255`.
- HSL uses hue `h` in degrees, saturation `s` from `0` through `100`, and
  lightness `l` from `0` through `100`.
- HSV uses hue `h` in degrees, saturation `s` from `0` through `100`, and
  value `v` from `0` through `100`.
- Finite HSL and HSV hues are normalized modulo `360`; for example, `-120`
  becomes `240`, and `360` becomes `0`.
- HSL and HSV output values are rounded to two decimal places. Intermediate
  calculations are not rounded.
- RGB output channels are integers, and HEX output is canonical lowercase
  six-digit HEX with a leading `#`.

Contrast uses WCAG relative luminance on full-precision encoded-sRGB results;
threshold checks use the unrounded ratio. The response includes the criterion,
threshold, raw and display ratios, normalized inputs, effective opaque colors,
the effective encoded-sRGB channels used for the calculation, and compositing
model. A translucent background requires an explicit opaque
`canvas` color. The documented `css-srgb-source-over` model composites in
encoded sRGB; this is a stated calculation context, not a claim about every
graphics pipeline. Non-text results apply only to the named object/boundary
and the in-scope WCAG 2.2 SC 1.4.11 comparison, not an interface as a whole.

WCAG contrast thresholds are:

- Normal text: AA `4.5`, AAA `7`
- Large text: AA `3`, AAA `4.5`

For opaque pairs the ratio is independent of foreground/background order.
With transparency, foreground/background compositing order matters. The shown
ratio is rounded to two decimal places only after threshold evaluation.

### Generate a palette

Use `POST /v1/colors/palette` with a base color and one of the supported
strategies. `outputFormat` is optional and defaults to `hex`.

Supported strategies are `complementary`, `analogous`, `triadic`, `tetradic`,
`split-complementary`, and `monochromatic`. Analogous palettes accept an
optional `count` from 2 to 12 and distribute hues evenly across a 60-degree
arc around the base hue. Other harmony strategies retain their defined fixed
counts and ordering.

```json
{
  "base": {
    "format": "hex",
    "value": "#3498db"
  },
  "strategy": "analogous",
  "count": 5,
  "outputFormat": "hex"
}
```

Every generated color is returned as a discriminated color object:

```json
{
  "base": {
    "format": "hex",
    "value": "#3498db"
  },
  "strategy": "analogous",
  "outputFormat": "hex",
  "colors": [
    {
      "format": "hex",
      "value": "#34dbca"
    },
    {
      "format": "hex",
      "value": "#3498db"
    },
    {
      "format": "hex",
      "value": "#3445db"
    }
  ]
}
```

Palette generation normalizes the validated base to sRGB, uses HSL for
palette mathematics, and converts each result to the requested output format.
Out-of-sRGB inputs are mapped during that normalization. Fixed output sizes
are 2 for complementary, 3 for default analogous/triadic/split-complementary,
4 for tetradic, and 5 for monochromatic. Analogous `count` changes its size.

Monochromatic palettes preserve the base hue and saturation. For base
lightness between `0` and `100`, their lightness values are
`[0, l / 2, l, (l + 100) / 2, 100]`. At lightness `0` or `100`, the values are
`[0, 25, 50, 75, 100]`.

### Domain generation and manipulation operations

The framework-independent domain also provides generation and manipulation
operations. These are implemented under `src/color/operations.ts`; the public
package exports are added in Phase 6, and REST routes are added in Phase 7.

`generateColors(count, { seed, constraints })` returns 1–1000 OKLCH colors.
Seeded calls return `algorithm: "mulberry32-v1"`; string seeds use 32-bit
FNV-1a and integer seeds must be safe integers. Unseeded calls use
`Math.random` and return `algorithm: "Math.random"`. Default ranges are L
`[0,1]`, C `[0,0.4]`, and H `[0,360]`; hue 360 is equivalent to canonical hue
0. Constraints can narrow each range.

Manipulation functions name their operation space: `rotateHue`,
`adjustLightness`, `adjustChroma`, and `adjustSaturation` operate in OKLCH;
`grayscaleColor` sets chroma to zero; `invertColor` complements mapped encoded
sRGB channels; `adjustAlpha` changes opacity while preserving the requested
representation where possible. Lightness clamps to `[0,1]`, chroma clamps at
zero, and saturation adjustment is a relative chroma delta (`0.5` adds 50%,
`-1` removes all chroma).

`mixColors(first, second, weight = 0.5, space = "oklab")` interpolates in
premultiplied OKLab or encoded sRGB and returns a `ColorValue` in that space.
`compositeColors(foreground, background, canvas?)` is a different operation:
it performs encoded-sRGB `css-srgb-source-over` compositing and requires an
opaque canvas when the background is translucent.

`generateOklchScale(stops, count, outputFormat = "hex")` samples 2–10 ordered
stops spanning positions 0 and 1, with non-decreasing lightness, at 2–101
evenly spaced positions. Stops must share alpha. Each result includes its
normalized position and conversion gamut-mapping metadata. `generateShades`,
`generateTints`, and `generateTones` return conversion results in order: base
to black, base to white, and base to a neutral at fixed lightness respectively.

### Create a color token

Use `POST /v1/colors/tokens` to create one developer-friendly color token.
Palette integration is not included. The token name must match
`^[a-z][a-z0-9-]*$`; valid names include `brand`, `brand-primary`, and
`surface-muted`.

```json
{
  "name": "brand",
  "color": {
    "format": "hex",
    "value": "#3498db"
  },
  "outputFormat": "hex"
}
```

`outputFormat` is optional and defaults to `hex`. It controls the structured
`ColorValue` in the response. CSS serialization is browser-oriented:

- HEX becomes `#3498db`.
- RGB becomes `rgb(52, 152, 219)`.
- HSL becomes `hsl(204.07, 69.87%, 53.14%)`.
- HSV remains HSV in the structured value, but becomes RGB CSS because
  `hsv()` is not broadly supported by browsers.

```json
{
  "token": {
    "name": "brand",
    "color": {
      "format": "hex",
      "value": "#3498db"
    },
    "cssVariable": "--color-brand",
    "cssValue": "#3498db"
  },
  "css": ":root {\n  --color-brand: #3498db;\n}"
}
```

The endpoint supports all six color formats. Structured token values preserve
alpha; CSS serialization uses HEX8 for translucent HEX and modern CSS color
syntax for OKLab/OKLCH.

### Batch conversion

Use `POST /v1/colors/batch/convert` to convert between 1 and 100 colors in a
single synchronous request. Each item may use a different input format, while
one shared `outputFormat` applies to the entire request. It defaults to `hex`.

Same-format conversions normalize the representation rather than preserve the
submitted representation byte-for-byte. Cross-format conversions retain
floating-point intermediate precision; RGB and HEX output remain quantized to
their defined integer/byte channels.

```json
{
  "colors": [
    {
      "format": "hex",
      "value": "#3498db"
    },
    {
      "format": "rgb",
      "value": {
        "r": 231,
        "g": 76,
        "b": 60
      }
    }
  ],
  "outputFormat": "hsl"
}
```

Results preserve input order and use the same `input` and `output` color
envelopes as the single-color conversion endpoint:

```json
{
  "results": [
    {
      "input": {
        "format": "hex",
        "value": "#3498db"
      },
      "output": {
        "format": "hsl",
        "value": {
          "h": 204.07,
          "s": 69.87,
          "l": 53.14
        }
      }
    },
    {
      "input": {
        "format": "rgb",
        "value": {
          "r": 231,
          "g": 76,
          "b": 60
        }
      },
      "output": {
        "format": "hsl",
        "value": {
          "h": 5.61,
          "s": 78.08,
          "l": 57.06
        }
      }
    }
  ]
}
```

Batch processing is atomic. If any item is invalid, the entire request fails
with `INVALID_COLOR`; the error includes the invalid item's zero-based `index`.
Malformed batch metadata, an empty batch, a batch larger than 100 items, or an
invalid output format returns `INVALID_REQUEST`.

Invalid requests return HTTP `400` with an error object containing a stable
`code` and human-readable `message`.

## Development commands

```bash
npm test
npm run typecheck
npm run build
```
