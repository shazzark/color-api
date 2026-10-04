import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startProductionServer, stopProductionServer } from "./lib/production-server.mjs";

async function expectJson(baseUrl, path, init, statusCode = 200) {
  const response = await fetch(new URL(path, baseUrl), { ...init, signal: AbortSignal.timeout(5000) });
  const body = response.status === 204 ? undefined : await response.json();
  assert.equal(response.status, statusCode, `${path} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function smokeApi(baseUrl, { concurrent, includeCanary }) {
  const health = await expectJson(baseUrl, "/health");
  assert.deepEqual(health, { status: "ok" });
  const document = await expectJson(baseUrl, "/openapi.json");
  assert.equal(document.openapi, "3.1.0");
  const convert = await expectJson(baseUrl, "/v1/colors/convert", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ from: "hex", to: "rgb", value: "#ff000080" })
  });
  assert.equal(convert.output.format, "rgb");
  assert.equal(convert.output.value.alpha, 0.502);
  const contrast = await expectJson(baseUrl, "/v1/colors/contrast", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ foreground: { format: "hex", value: "#000000" }, background: { format: "hex", value: "#ffffff" }, criterion: "wcag-2.2-1.4.11", context: "icon boundary" })
  });
  assert.equal(contrast.passesCriterion, true);
  const batch = await expectJson(baseUrl, "/v1/colors/batch/convert", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ colors: [{ format: "hex", value: "#3498db" }, { format: "hex", value: "#e74c3c80" }], outputFormat: "rgb" })
  });
  assert.equal(batch.results.length, 2);
  const invalid = await expectJson(baseUrl, "/v1/colors/normalize", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ color: { format: "hex", value: includeCanary ? "release-smoke-secret-canary" : "not-a-color" } })
  }, 400);
  assert.equal(invalid.error.code, "INVALID_COLOR");
  if (concurrent) {
    const results = await Promise.all(Array.from({ length: 20 }, () => expectJson(baseUrl, "/v1/colors/convert", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: "hex", to: "oklch", value: "#3498db" })
    })));
    assert.equal(results.length, 20);
  }
}

const bundleRoot = fileURLToPath(new URL("../dist/release-bundle/", import.meta.url));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli !== undefined, "release smoke must run through npm so npm_execpath is available");
const install = spawn(process.execPath, [npmCli, "ci", "--omit=dev", "--ignore-scripts"], {
  cwd: bundleRoot,
  stdio: "inherit"
});
const installCode = await new Promise((resolve, reject) => {
  install.once("error", reject);
  install.once("exit", (code) => resolve(code));
});
assert.equal(installCode, 0, "production-only dependency install must succeed");
const local = await startProductionServer({ serverRoot: bundleRoot });
try {
  await smokeApi(local.baseUrl, { concurrent: true, includeCanary: true });
} finally {
  await stopProductionServer(local.child);
}
assert.ok(!local.logs().includes("release-smoke-secret-canary"), "server logs must not contain request payload values");
console.log("Built production server smoke passed: health, OpenAPI, alpha conversion, accessibility, batch, safe errors, and 20 concurrent requests.");

if (process.env.PUBLIC_API_URL !== undefined && process.env.PUBLIC_API_URL.trim() !== "") {
  const publicUrl = new URL(process.env.PUBLIC_API_URL);
  assert.ok(publicUrl.protocol === "http:" || publicUrl.protocol === "https:", "PUBLIC_API_URL must use HTTP(S)");
  assert.equal(publicUrl.username, "", "PUBLIC_API_URL must not include credentials");
  assert.equal(publicUrl.password, "", "PUBLIC_API_URL must not include credentials");
  assert.equal(publicUrl.search, "", "PUBLIC_API_URL must not include a query string");
  assert.equal(publicUrl.hash, "", "PUBLIC_API_URL must not include a fragment");
  const baseUrl = publicUrl.toString().replace(/\/$/, "");
  await smokeApi(baseUrl, { concurrent: false, includeCanary: false });
  console.log("Configured public API smoke passed.");
}
