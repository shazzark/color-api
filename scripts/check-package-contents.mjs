import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../dist/npm-package/", import.meta.url));
const manifest = JSON.parse(await readFile(new URL("../dist/npm-package/package.json", import.meta.url), "utf8"));
assert.equal(manifest.dependencies?.fastify, undefined, "published package must not depend on Fastify");
assert.equal(manifest.name, "chromaforge", "staged package must use the selected public name");
assert.equal(manifest.version, "1.0.0", "staged package must use the approved release version");
assert.equal(manifest.license, "MIT", "staged package must declare the selected license");
assert.equal(manifest.author, "Daniel Nnam Chidozie", "staged package must declare the selected author");
assert.equal(manifest.repository?.url, "git+https://github.com/shazzark/color-api.git", "staged package must point to the existing source repository");
assert.equal(manifest.bugs?.url, "https://github.com/shazzark/color-api/issues", "staged package must point to the existing issue tracker");
assert.ok(manifest.keywords?.includes("chromaforge"), "staged package must include its product keyword");
assert.equal(manifest.private, undefined, "staged package must be publishable while the repository remains private");

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
assert.ok(paths.includes("LICENSE"), "package license is missing");
for (const path of paths) {
  assert.ok(
    path.startsWith("dist/package/") || path === "README.md" || path === "CHANGELOG.md" || path === "LICENSE" || path === "package.json",
    `unexpected file in package: ${path}`
  );
}
assert.ok(packageInfo.unpackedSize <= 250_000, `package unpacked size ${packageInfo.unpackedSize} exceeds 250 KB`);
console.log(`Package contents verified: ${paths.length} files, ${packageInfo.size} packed bytes, ${packageInfo.unpackedSize} unpacked bytes.`);
