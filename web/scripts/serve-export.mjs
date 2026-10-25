import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { existsSync, statSync, readFileSync } from "node:fs";

const root = resolve("out");
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".woff2", "font/woff2"]
]);

if (!existsSync(root)) throw new Error("Static export is missing. Run `npm run build` before Playwright tests.");

const server = createServer((request, response) => {
  scheduleShutdown();
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const routePath = resolve(root, relativePath);
  const candidates = [
    routePath,
    resolve(routePath, "index.html"),
    `${routePath}.html`
  ];
  const file = candidates.find((candidate) => candidate.startsWith(`${root}${sep}`) && existsSync(candidate) && statSync(candidate).isFile());
  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }

  response.writeHead(200, { "content-type": mimeTypes.get(extname(file)) ?? "application/octet-stream" });
  response.end(readFileSync(file));
});

let shutdownTimer;
function scheduleShutdown() {
  clearTimeout(shutdownTimer);
  // Release Playwright's Windows webServer child after browser traffic stops.
  shutdownTimer = setTimeout(() => server.close(() => process.exit(0)), 15_000);
}

server.listen(3100, "127.0.0.1", scheduleShutdown);
process.once("SIGINT", () => server.close(() => process.exit(0)));
process.once("SIGTERM", () => server.close(() => process.exit(0)));
