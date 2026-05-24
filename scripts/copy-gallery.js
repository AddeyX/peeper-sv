import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const src = path.resolve(here, "../src/gallery");
const dest = path.resolve(here, "../dist/gallery");

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

console.log("copied gallery → dist/gallery");
