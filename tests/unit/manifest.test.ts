import { describe, it, expect } from "vitest";
import { buildManifest, manifestToModuleSource } from "../../src/plugin/manifest.js";
import type { ComponentEntry } from "../../src/shared/types.js";

const entries: ComponentEntry[] = [
  {
    id: "abc123",
    name: "Button",
    relPath: "src/lib/Button.svelte",
    importPath: "/src/lib/Button.svelte",
    group: ["lib"],
    status: "renderable",
    props: [{ name: "label", type: { kind: "string" }, required: true }],
  },
];

describe("manifest", () => {
  it("builds a manifest object with timestamp and components", () => {
    const m = buildManifest(entries);
    expect(m.components).toEqual(entries);
    expect(m.generatedAt).toBeGreaterThan(0);
  });

  it("serializes manifest as an ESM module with default export", () => {
    const m = buildManifest(entries);
    const src = manifestToModuleSource(m);
    expect(src).toContain("export default");
    expect(src).toContain('"Button"');
    expect(src).toContain('"relPath":"src/lib/Button.svelte"');
  });

  it("serialization is deterministic given identical input (excluding generatedAt)", () => {
    const a = manifestToModuleSource({ generatedAt: 0, components: entries });
    const b = manifestToModuleSource({ generatedAt: 0, components: entries });
    expect(a).toBe(b);
  });
});
