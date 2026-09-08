# Color API

A learning project for validating and converting colors.

## First milestone

The first milestone provides:

- `GET /health`
- `POST /v1/colors/convert` for HEX to RGB conversion

Only six-digit HEX values are supported. The leading `#` is optional.

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

Invalid requests return HTTP `400` with an error object containing a stable
`code` and human-readable `message`.

## Development commands

```bash
npm test
npm run typecheck
npm run build
```
