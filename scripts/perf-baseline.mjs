import os from "node:os";
import { performance } from "node:perf_hooks";
import { convertColor } from "../dist/package/index.js";
import { startProductionServer, stopProductionServer } from "./lib/production-server.mjs";

const warmupCount = 20;
const sampleCount = 250;
const requestBody = JSON.stringify({ from: "hex", to: "oklch", value: "#3498db" });
const apiTimings = [];
const packageTimings = [];
const server = await startProductionServer({ rateLimitMax: 1000 });
try {
  for (let index = 0; index < warmupCount; index += 1) {
    convertColor({ format: "hex", value: "#3498db" }, "oklch");
    const response = await fetch(`${server.baseUrl}/v1/colors/convert`, { method: "POST", headers: { "content-type": "application/json" }, body: requestBody });
    if (!response.ok) throw new Error(`Warmup API request failed with ${response.status}`);
    await response.arrayBuffer();
  }
  const totalStart = performance.now();
  for (let index = 0; index < sampleCount; index += 1) {
    const packageStart = performance.now();
    convertColor({ format: "hex", value: "#3498db" }, "oklch");
    packageTimings.push(performance.now() - packageStart);
    const start = performance.now();
    const response = await fetch(`${server.baseUrl}/v1/colors/convert`, { method: "POST", headers: { "content-type": "application/json" }, body: requestBody });
    if (!response.ok) throw new Error(`API baseline request failed with ${response.status}`);
    await response.arrayBuffer();
    apiTimings.push(performance.now() - start);
  }
  const elapsedMs = performance.now() - totalStart;
  apiTimings.sort((left, right) => left - right);
  packageTimings.sort((left, right) => left - right);
  const percentile = (timings, fraction) => timings[Math.ceil(timings.length * fraction) - 1];
  console.log(JSON.stringify({
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    operations: { package: "convertColor (hex to oklch)", api: "POST /v1/colors/convert (hex to oklch)" },
    warmupRequests: warmupCount,
    measuredRequests: sampleCount,
    elapsedMs: Number(elapsedMs.toFixed(2)),
    apiThroughputRequestsPerSecond: Number((sampleCount * 1000 / elapsedMs).toFixed(2)),
    packageLatencyMs: { p50: Number(percentile(packageTimings, 0.5).toFixed(3)), p95: Number(percentile(packageTimings, 0.95).toFixed(3)), max: Number(packageTimings.at(-1).toFixed(3)) },
    apiLatencyMs: { p50: Number(percentile(apiTimings, 0.5).toFixed(3)), p95: Number(percentile(apiTimings, 0.95).toFixed(3)), max: Number(apiTimings.at(-1).toFixed(3)) }
  }, null, 2));
} finally {
  await stopProductionServer(server.child);
}
