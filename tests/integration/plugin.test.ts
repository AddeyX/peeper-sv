import { describe, it, expect } from "vitest";
import path from "node:path";
import { peeperPlugin } from "../../src/plugin/index.js";
import type { Plugin } from "vite";

const fixtureRoot = path.resolve(__dirname, "../fixtures/plugin-sample");

function asObjPlugin(p: Plugin | Plugin[]): Plugin {
  return Array.isArray(p) ? p[0]! : p;
}

describe("peeperPlugin", () => {
  it("resolves and loads virtual:peeper-manifest", async () => {
    const plugin = asObjPlugin(peeperPlugin({ root: fixtureRoot }));

    // @ts-expect-error
    await plugin.buildStart?.call({}, {});

    // @ts-expect-error
    const resolved = await plugin.resolveId?.call({}, "virtual:peeper-manifest", undefined);
    expect(resolved).toBe("\0virtual:peeper-manifest");

    // @ts-expect-error
    const loaded = await plugin.load?.call({}, "\0virtual:peeper-manifest");
    expect(loaded).toContain("export default");
    expect(loaded).toContain('"Button"');
    expect(loaded).toContain('"UserCard"');
  });

  it("classifies UserCard as needs-setup and Button as renderable", async () => {
    const plugin = asObjPlugin(peeperPlugin({ root: fixtureRoot }));
    // @ts-expect-error
    await plugin.buildStart?.call({}, {});
    // @ts-expect-error
    const loaded: string = await plugin.load?.call({}, "\0virtual:peeper-manifest");
    const json = JSON.parse(loaded.replace(/^export default /, "").replace(/;\s*$/, ""));
    const byName = Object.fromEntries(
      json.components.map((c: any) => [c.name, c]),
    );
    expect(byName.Button.status).toBe("renderable");
    expect(byName.UserCard.status).toBe("needs-setup");
    expect(byName.UserCard.blockers[0]).toMatch(/user/);
  });
});
