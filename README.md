# Color API

A learning project for validating and converting colors.

## Supported conversions

The API provides:

- `GET /health`
- `POST /v1/colors/convert` for color conversion
- `POST /v1/colors/contrast` for WCAG 2.x contrast analysis
- `POST /v1/colors/palette` for deterministic palette generation

The following 12 directed conversions are supported:

- HEX -> RGB, HSL, HSV
- RGB -> HEX, HSL, HSV
- HSL -> RGB, HEX, HSV
- HSV -> RGB, HEX, HSL

RGB is used as the internal intermediate representation for non-RGB formats.

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
  }
}
```

### Structured color input

HEX values are strings. RGB, HSL, and HSV values are objects:

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

Use `POST /v1/colors/contrast` to analyze the contrast between a foreground
and background color. Both colors accept HEX, RGB, HSL, or HSV values, and the
original input representations are preserved in the response.

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
  }
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

Contrast analysis uses opaque sRGB colors and WCAG 2.x relative luminance.
Alpha and transparency are not supported.

WCAG contrast thresholds are:

- Normal text: AA `4.5`, AAA `7`
- Large text: AA `3`, AAA `4.5`

The contrast ratio is independent of foreground/background order and is
rounded to two decimal places only after the calculation.

### Generate a palette

Use `POST /v1/colors/palette` with a base color and one of the supported
strategies. `outputFormat` is optional and defaults to `hex`.

Supported strategies are `complementary`, `analogous`, `triadic`,
`split-complementary`, and `monochromatic`.

```json
{
  "base": {
    "format": "hex",
    "value": "#3498db"
  },
  "strategy": "analogous",
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

Palette generation converts the validated base color to RGB, uses HSL for
palette mathematics, and converts each result to the requested output format.
The fixed output sizes are 2 for complementary, 3 for analogous, triadic, and
split-complementary, and 5 for monochromatic.

Monochromatic palettes preserve the base hue and saturation. For base
lightness between `0` and `100`, their lightness values are
`[0, l / 2, l, (l + 100) / 2, 100]`. At lightness `0` or `100`, the values are
`[0, 25, 50, 75, 100]`.

Invalid requests return HTTP `400` with an error object containing a stable
`code` and human-readable `message`.

## Development commands

```bash
npm test
npm run typecheck
npm run build
```
