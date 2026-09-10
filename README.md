# Color API

A learning project for validating and converting colors.

## Supported conversions

The API provides:

- `GET /health`
- `POST /v1/colors/convert` for color conversion

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

Invalid requests return HTTP `400` with an error object containing a stable
`code` and human-readable `message`.

## Development commands

```bash
npm test
npm run typecheck
npm run build
```
