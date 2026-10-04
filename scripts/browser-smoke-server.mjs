import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(fileURLToPath(new URL("../dist/package/", import.meta.url)));
const html = `<!doctype html>
<meta charset="utf-8">
<link rel="icon" href="data:,">
<title>Color API browser package smoke</title>
<output id="result">loading</output>
<script type="module">
  import { convertColor, generateColors } from "/index.js";
  const converted = convertColor({ format: "hex", value: "#3498db" }, "oklch");
  const generated = generateColors(2, { seed: "browser-smoke" });
  const result = {
    format: converted.output.format,
    gamutMapped: converted.gamutMapped,
    generated: generated.colors.length
  };
  document.querySelector("#result").textContent = JSON.stringify(result);
  document.documentElement.dataset.smoke = result.format === "oklch" && result.gamutMapped === false && result.generated === 2
    ? "passed"
    : "failed";
</script>`;

const server = createServer(async (request, response) => {
  try {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    const target = resolve(packageRoot, `.${decodeURIComponent(request.url ?? "/")}`);
    if (!target.startsWith(`${packageRoot}${sep}`)) throw new Error("Invalid path");
    const body = await readFile(target);
    response.writeHead(200, { "content-type": extname(target) === ".js" ? "text/javascript; charset=utf-8" : "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(4178, "127.0.0.1", () => console.log("Browser package smoke server listening on port 4178"));
