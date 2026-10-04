import { writeFile } from "node:fs/promises";
import { OPENAPI_SPEC } from "../dist/src/openapi.js";

await writeFile(new URL("../openapi.json", import.meta.url), `${JSON.stringify(OPENAPI_SPEC, null, 2)}\n`, "utf8");
