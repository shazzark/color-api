import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Could not allocate a local port");
  const { port } = address;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

function minimalEnvironment(port, rateLimitMax) {
  return {
    HOST: "127.0.0.1",
    PORT: String(port),
    NODE_ENV: "production",
    RATE_LIMIT_MAX: String(rateLimitMax),
    ...(process.platform === "win32" && process.env.SystemRoot !== undefined ? { SystemRoot: process.env.SystemRoot } : {})
  };
}

export async function startProductionServer({ rateLimitMax = 120, serverRoot = fileURLToPath(new URL("../../", import.meta.url)) } = {}) {
  const port = await freePort();
  const root = resolve(serverRoot);
  const child = spawn(process.execPath, [resolve(root, "dist/server/server.js")], {
    cwd: root,
    env: minimalEnvironment(port, rateLimitMax),
    stdio: ["ignore", "pipe", "pipe"]
  });
  const logChunks = [];
  let launchError;
  child.stdout.on("data", (chunk) => logChunks.push(chunk.toString()));
  child.stderr.on("data", (chunk) => logChunks.push(chunk.toString()));
  child.on("error", (error) => { launchError = error; });
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10_000;
  let ready = false;
  while (Date.now() < deadline) {
    if (launchError !== undefined) break;
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for the production process to bind its port. */ }
    await delay(100);
  }
  if (!ready) {
    await stopProductionServer(child);
    throw new Error(`Production server did not become healthy: ${String(launchError ?? logChunks.join("").slice(-4000))}`);
  }
  return { baseUrl, child, logs: () => logChunks.join("") };
}

export async function stopProductionServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  let resolveExit;
  const exited = new Promise((resolve) => { resolveExit = resolve; });
  child.once("close", resolveExit);
  child.kill("SIGTERM");
  const timeout = new AbortController();
  const graceful = await Promise.race([exited.then(() => true), delay(3000, false, { signal: timeout.signal }).catch(() => false)]);
  timeout.abort();
  if (!graceful) child.kill("SIGKILL");
  await exited;
}
