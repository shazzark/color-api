import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

function docker(args) {
  const result = spawnSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `docker ${args[0]} failed: ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

const tag = `color-api-smoke:${randomUUID()}`;
const port = process.env.CONTAINER_SMOKE_PORT ?? "18080";
let container;
let imageBuilt = false;
try {
  docker(["build", "--tag", tag, "."]);
  imageBuilt = true;
  container = docker(["run", "--detach", "--rm", "--publish", `127.0.0.1:${port}:8080`, tag]);
  const baseUrl = `http://127.0.0.1:${port}`;
  let health;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      health = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
      if (health.ok) break;
    } catch { /* The server may still be starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.equal(health?.status, 200, "container health endpoint did not become ready");
  assert.deepEqual(await health.json(), { status: "ok" });

  const response = await fetch(`${baseUrl}/v1/colors/convert`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ from: "hex", to: "rgb", value: "#ff000080" }),
    signal: AbortSignal.timeout(5000)
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.output.value.alpha, 0.502);
  console.log("Docker image smoke passed: container bound on port 8080; health and alpha conversion succeeded.");
} finally {
  if (container !== undefined) docker(["stop", container]);
  if (imageBuilt) docker(["image", "rm", tag]);
}
