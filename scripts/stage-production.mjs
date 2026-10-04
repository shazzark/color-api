import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = resolve(repositoryRoot, "dist");
const bundleRoot = resolve(distRoot, "release-bundle");
if (!bundleRoot.startsWith(`${distRoot}${sep}`)) throw new Error("Release bundle path must stay inside dist");

const packageJson = JSON.parse(await readFile(resolve(repositoryRoot, "package.json"), "utf8"));
await rm(bundleRoot, { recursive: true, force: true });
await mkdir(bundleRoot, { recursive: true });
await cp(resolve(distRoot, "server"), resolve(bundleRoot, "dist/server"), { recursive: true });
await cp(resolve(repositoryRoot, "package-lock.json"), resolve(bundleRoot, "package-lock.json"));
await writeFile(resolve(bundleRoot, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(`Staged production server bundle at ${bundleRoot}`);
