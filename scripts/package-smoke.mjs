import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as api from "chromaforge";

assert.equal(api.convertColor({ format: "hex", value: "#3498db" }, "rgb").output.format, "rgb");
assert.equal(api.generateColors(2, { seed: "consumer" }).colors.length, 2);
assert.equal(api.generateHslPalette({ h: 0, s: 50, l: 50 }, "tetradic").length, 4);
assert.equal(typeof api.createCssVariablesBlock, "function");

async function listJavascript(directory) {
  const path = fileURLToPath(directory);
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) return listJavascript(pathToFileURL(entryPath + "/"));
    return entry.name.endsWith(".js") ? [entryPath] : [];
  }));
  return nested.flat();
}
const modules = await listJavascript(new URL("../dist/package/", import.meta.url));
const contents = await Promise.all(modules.map((file) => readFile(file, "utf8")));
const imports = contents.flatMap((source) => [
  ...Array.from(source.matchAll(/^\s*(?:import|export)\s+(?:[^'";\r\n]*?\s+from\s*)?['"]([^'"]+)['"]/gm), (match) => match[0])
    .filter((statement) => !/^\s*import\s+type\b/.test(statement))
    .map((statement) => statement.match(/['"]([^'"]+)['"]/)?.[1]),
  ...Array.from(source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1])
]).filter((specifier) => specifier !== undefined);
assert.deepEqual(imports.filter((specifier) => !specifier.startsWith(".")), [],
  `package output must only import relative framework-independent modules: ${JSON.stringify(imports)}`);
console.log("Built ESM package smoke passed; package graph is framework-independent.");
