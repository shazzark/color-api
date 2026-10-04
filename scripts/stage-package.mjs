import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = resolve(repositoryRoot, "dist");
const packageRoot = resolve(distRoot, "npm-package");
if (!packageRoot.startsWith(`${distRoot}${sep}`)) throw new Error("Package staging path must stay inside dist");

const rootPackage = JSON.parse(await readFile(resolve(repositoryRoot, "package.json"), "utf8"));
const packageManifest = {
  name: rootPackage.name,
  version: rootPackage.version,
  description: rootPackage.description,
  author: rootPackage.author,
  license: rootPackage.license,
  repository: rootPackage.repository,
  bugs: rootPackage.bugs,
  keywords: rootPackage.keywords,
  type: rootPackage.type,
  main: rootPackage.main,
  types: rootPackage.types,
  exports: rootPackage.exports,
  files: rootPackage.files,
  sideEffects: rootPackage.sideEffects,
  engines: rootPackage.engines
};

await rm(packageRoot, { recursive: true, force: true });
await mkdir(packageRoot, { recursive: true });
await cp(resolve(distRoot, "package"), resolve(packageRoot, "dist/package"), { recursive: true });
await cp(resolve(repositoryRoot, "README.md"), resolve(packageRoot, "README.md"));
await cp(resolve(repositoryRoot, "CHANGELOG.md"), resolve(packageRoot, "CHANGELOG.md"));
await cp(resolve(repositoryRoot, "LICENSE"), resolve(packageRoot, "LICENSE"));
await writeFile(resolve(packageRoot, "package.json"), `${JSON.stringify(packageManifest, null, 2)}\n`);
console.log(`Staged framework-independent npm package at ${packageRoot}`);
