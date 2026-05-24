import { describe, it, expect } from "vitest";
import path from "node:path";
import { scan } from "../../src/plugin/scan.js";

const fixture = path.resolve(__dirname, "../fixtures/scan");

describe("scan", () => {
  it("finds .svelte files under src/, excluding src/routes by default", async () => {
    const results = await scan({
      root: fixture,
      scan: ["src/**/*.svelte"],
      ignore: ["src/routes/**"],
    });
    const rels = results.map((r) => r.relPath).sort();
    expect(rels).toEqual([
      "src/forms/Input.svelte",
      "src/forms/Input.test.svelte",
      "src/lib/Button.svelte",
      "src/lib/ui/Card.svelte",
    ]);
  });

  it("honors additional ignore patterns", async () => {
    const results = await scan({
      root: fixture,
      scan: ["src/**/*.svelte"],
      ignore: ["src/routes/**", "**/*.test.svelte"],
    });
    const rels = results.map((r) => r.relPath).sort();
    expect(rels).toEqual([
      "src/forms/Input.svelte",
      "src/lib/Button.svelte",
      "src/lib/ui/Card.svelte",
    ]);
  });

  it("computes group from directory segments under src/", async () => {
    const results = await scan({
      root: fixture,
      scan: ["src/**/*.svelte"],
      ignore: ["src/routes/**", "**/*.test.svelte"],
    });
    const card = results.find((r) => r.relPath === "src/lib/ui/Card.svelte");
    expect(card?.group).toEqual(["lib", "ui"]);
    const button = results.find((r) => r.relPath === "src/lib/Button.svelte");
    expect(button?.group).toEqual(["lib"]);
  });
});
