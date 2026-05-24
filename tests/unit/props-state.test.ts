import { describe, it, expect } from "vitest";
import { defaultPropValues } from "../../src/gallery/lib/props-state.js";
import type { PropSchema } from "../../src/shared/types.js";

describe("defaultPropValues", () => {
  it("uses defaultValue when present", () => {
    const props: PropSchema[] = [
      { name: "count", type: { kind: "number" }, required: false, defaultValue: 5 },
    ];
    expect(defaultPropValues(props)).toEqual({ count: 5 });
  });

  it("synthesizes placeholder for required string with no default", () => {
    const props: PropSchema[] = [
      { name: "label", type: { kind: "string" }, required: true },
    ];
    expect(defaultPropValues(props)).toEqual({ label: "Sample" });
  });

  it("uses 0 for number, false for boolean when required no default", () => {
    const props: PropSchema[] = [
      { name: "n", type: { kind: "number" }, required: true },
      { name: "b", type: { kind: "boolean" }, required: true },
    ];
    expect(defaultPropValues(props)).toEqual({ n: 0, b: false });
  });

  it("picks first enum value when required no default", () => {
    const props: PropSchema[] = [
      { name: "v", type: { kind: "enum", values: ["a", "b"] }, required: true },
    ];
    expect(defaultPropValues(props)).toEqual({ v: "a" });
  });

  it("omits unsupported props from the state", () => {
    const props: PropSchema[] = [
      { name: "label", type: { kind: "string" }, required: true },
      { name: "user", type: { kind: "unsupported", reason: "object" }, required: false },
    ];
    expect(defaultPropValues(props)).toEqual({ label: "Sample" });
  });
});
