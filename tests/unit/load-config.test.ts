import { describe, it, expect } from "vitest";
import path from "node:path";
import { loadPeeperConfig } from "../../src/server/load-config.js";

const fixtures = path.resolve(__dirname, "../fixtures/configs");

describe("loadPeeperConfig", () => {
  it("returns empty config when no file present", async () => {
    const cfg = await loadPeeperConfig({ root: path.join(fixtures, "no-config") });
    expect(cfg).toEqual({});
  });

  it("loads peeper.config.js when present", async () => {
    const cfg = await loadPeeperConfig({ root: path.join(fixtures, "with-config") });
    expect(cfg.scan).toEqual(["src/components/**/*.svelte"]);
    expect(cfg.ignore).toEqual(["**/internal/**"]);
    expect(cfg.globalCss).toEqual(["src/main.css"]);
    expect(cfg.viewports).toEqual([{ name: "phone", width: 320 }]);
  });

  it("honors explicit configPath", async () => {
    const cfg = await loadPeeperConfig({
      root: path.join(fixtures, "no-config"),
      configPath: path.join(fixtures, "with-config/peeper.config.js"),
    });
    expect(cfg.scan).toEqual(["src/components/**/*.svelte"]);
  });
});
