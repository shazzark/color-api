import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../dist/npm-package/", import.meta.url));
const manifest = JSON.parse(await readFile(new URL("../dist/npm-package/package.json", import.meta.url), "utf8"));
assert.equal(manifest.dependencies?.fastify, undefined, "published package must not depend on Fastify");

const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: packageRoot,
  encoding: "utf8",
  maxBuffer: 4 * 1024 * 1024,
  shell: process.platform === "win32"
});
const [packageInfo] = JSON.parse(output);
assert.ok(packageInfo && Array.isArray(packageInfo.files), "npm pack did not report the package file list");
const paths = packageInfo.files.map(({ path }) => path);
assert.ok(paths.includes("dist/package/index.js"), "package ESM entry is missing");
assert.ok(paths.includes("dist/package/index.d.ts"), "package declarations are missing");
assert.ok(paths.includes("README.md"), "package README is missing");
assert.ok(paths.includes("CHANGELOG.md"), "package changelog is missing");
for (const path of paths) {
  assert.ok(
    path.startsWith("dist/package/") || path === "README.md" || path === "CHANGELOG.md" || path === "package.json",
    `unexpected file in package: ${path}`
  );
}
assert.ok(packageInfo.unpackedSize <= 250_000, `package unpacked size ${packageInfo.unpackedSize} exceeds 250 KB`);
console.log(`Package contents verified: ${paths.length} files, ${packageInfo.size} packed bytes, ${packageInfo.unpackedSize} unpacked bytes.`);
