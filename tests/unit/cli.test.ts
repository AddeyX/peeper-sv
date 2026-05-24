import { describe, it, expect } from "vitest";
import { parseArgs } from "../../src/cli.js";

describe("parseArgs", () => {
  it("defaults", () => {
    const opts = parseArgs(["node", "peeper-sv"]);
    expect(opts.port).toBe(4321);
    expect(opts.host).toBe("localhost");
    expect(opts.open).toBe(true);
    expect(opts.root).toBe(process.cwd());
  });

  it("--port", () => {
    expect(parseArgs(["node", "peeper-sv", "--port", "5000"]).port).toBe(5000);
  });

  it("--no-open", () => {
    expect(parseArgs(["node", "peeper-sv", "--no-open"]).open).toBe(false);
  });

  it("--scan repeatable", () => {
    const opts = parseArgs([
      "node", "peeper-sv",
      "--scan", "src/a/**/*.svelte",
      "--scan", "src/b/**/*.svelte",
    ]);
    expect(opts.scan).toEqual(["src/a/**/*.svelte", "src/b/**/*.svelte"]);
  });

  it("--ignore repeatable", () => {
    const opts = parseArgs([
      "node", "peeper-sv",
      "--ignore", "**/x/**",
      "--ignore", "**/y/**",
    ]);
    expect(opts.ignore).toEqual(["**/x/**", "**/y/**"]);
  });

  it("--root", () => {
    expect(parseArgs(["node", "peeper-sv", "--root", "/tmp/foo"]).root).toBe("/tmp/foo");
  });
});
