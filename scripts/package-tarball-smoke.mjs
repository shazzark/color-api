import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const packageRoot = resolve(repositoryRoot, "dist/npm-package");
const workRoot = await mkdtemp(join(tmpdir(), "color-api-package-consumer-"));
const safeTempRoot = resolve(tmpdir());
if (!resolve(workRoot).startsWith(`${safeTempRoot}${sep}`)) throw new Error("Package consumer directory escaped the OS temp directory");
const npmCli = process.env.npm_execpath;
assert.ok(npmCli !== undefined, "tarball smoke must run through npm so npm_execpath is available");
const npmOptions = { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] };

try {
  const packed = JSON.parse(execFileSync(process.execPath, [npmCli, "pack", "--json", "--pack-destination", workRoot], {
    ...npmOptions,
    cwd: packageRoot
  }));
  assert.equal(packed.length, 1, "npm pack should produce one tarball");
  const tarball = join(workRoot, packed[0].filename);
  await writeFile(join(workRoot, "package.json"), JSON.stringify({ private: true, type: "module" }));
  execFileSync(process.execPath, [npmCli, "install", "--ignore-scripts", "--no-audit", "--no-fund", "--no-save", "--package-lock=false", tarball], {
    ...npmOptions,
    cwd: workRoot
  });
  const installedManifest = JSON.parse(await readFile(join(workRoot, "node_modules/color-api/package.json"), "utf8"));
  assert.equal(installedManifest.dependencies?.fastify, undefined, "published package must not install the HTTP server dependency");

  const consumerScript = `import assert from "node:assert/strict";\nimport { convertColor, generateColors } from "color-api";\nassert.equal(convertColor({ format: "hex", value: "#3498db" }, "rgb").output.format, "rgb");\nassert.equal(generateColors(2, { seed: "tarball-consumer" }).colors.length, 2);\n`;
  const scriptPath = join(workRoot, "consumer.mjs");
  await writeFile(scriptPath, consumerScript);
  execFileSync(process.execPath, [scriptPath], { cwd: workRoot, stdio: "inherit" });

  const consumerTsConfig = {
    compilerOptions: {
      target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true,
      skipLibCheck: false, noEmit: true, types: []
    },
    files: ["consumer.ts"]
  };
  await cp(join(repositoryRoot, "tests/fixtures/package-consumer.ts"), join(workRoot, "consumer.ts"));
  await writeFile(join(workRoot, "tsconfig.json"), JSON.stringify(consumerTsConfig));
  execFileSync(process.execPath, [resolve(repositoryRoot, "node_modules/typescript/bin/tsc"), "--project", join(workRoot, "tsconfig.json")], {
    cwd: workRoot,
    stdio: "inherit"
  });
  console.log(`Packed package consumer smoke passed: ${packed[0].filename} (${packed[0].size} bytes).`);
} finally {
  await rm(workRoot, { recursive: true, force: true });
}
