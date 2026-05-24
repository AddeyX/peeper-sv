import { describe, it, expect } from "vitest";
import { parseHash, encodeHash } from "../../src/gallery/lib/hash-router.js";

describe("hash-router", () => {
  it("parses empty hash", () => {
    expect(parseHash("")).toEqual({ relPath: null, props: {} });
  });

  it("parses path + query", () => {
    const r = parseHash("#/lib/Button?label=Hi&count=3&disabled=true");
    expect(r.relPath).toBe("src/lib/Button.svelte");
    expect(r.props).toEqual({ label: "Hi", count: 3, disabled: true });
  });

  it("encodes hash from relPath + props", () => {
    const h = encodeHash("src/lib/Button.svelte", { label: "Hi", n: 3, b: true });
    expect(h).toBe("#/lib/Button?label=Hi&n=3&b=true");
  });

  it("omits empty props from encoded hash", () => {
    expect(encodeHash("src/lib/Button.svelte", {})).toBe("#/lib/Button");
  });
});
