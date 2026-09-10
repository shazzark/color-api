# Color API

A learning project for validating and converting colors.

## First milestone

The current milestone provides:

- `GET /health`
- `POST /v1/colors/convert` for HEX to RGB, HSL, and HSV conversion

Only six-digit HEX values are supported. The leading `#` is optional.
HSL and HSV responses use hue in degrees (`0` to `<360`) and percentages for
saturation, lightness, and value (`0` to `100`). Values are rounded to two
decimal places.

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

Invalid requests return HTTP `400` with an error object containing a stable
`code` and human-readable `message`.

## Development commands

```bash
npm test
npm run typecheck
npm run build
```
