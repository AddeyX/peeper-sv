import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { resolveGlobalCss } from "../../src/server/global-css.js";

async function tmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "peeper-css-"));
}

describe("resolveGlobalCss", () => {
  it("auto-detects src/app.css when present", async () => {
    const root = await tmp();
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src/app.css"), "body{}");
    const result = await resolveGlobalCss({ root, configured: undefined });
    expect(result).toEqual([path.join(root, "src/app.css")]);
  });

  it("auto-detects src/app.postcss when present", async () => {
    const root = await tmp();
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src/app.postcss"), "body{}");
    const result = await resolveGlobalCss({ root, configured: undefined });
    expect(result).toEqual([path.join(root, "src/app.postcss")]);
  });

  it("returns empty array when configured is []", async () => {
    const root = await tmp();
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src/app.css"), "body{}");
    const result = await resolveGlobalCss({ root, configured: [] });
    expect(result).toEqual([]);
  });

  it("merges auto-detect with configured paths when configured is non-empty", async () => {
    const root = await tmp();
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src/app.css"), "body{}");
    await fs.writeFile(path.join(root, "src/extra.css"), "body{}");
    const result = await resolveGlobalCss({
      root,
      configured: ["src/extra.css"],
    });
    expect(result.map((p) => path.basename(p)).sort()).toEqual([
      "app.css",
      "extra.css",
    ]);
  });
});
