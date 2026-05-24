import { describe, it, expect } from "vitest";
import { classify } from "../../src/plugin/classify.js";
import type { PropSchema } from "../../src/shared/types.js";

describe("classify", () => {
  it("renderable when all props are supported", () => {
    const props: PropSchema[] = [
      { name: "label", type: { kind: "string" }, required: true },
      { name: "count", type: { kind: "number" }, required: false, defaultValue: 0 },
    ];
    const result = classify(props);
    expect(result.status).toBe("renderable");
    expect(result.blockers).toBeUndefined();
  });

  it("renderable when unsupported prop is optional", () => {
    const props: PropSchema[] = [
      {
        name: "onClick",
        type: { kind: "unsupported", reason: "function" },
        required: false,
      },
    ];
    expect(classify(props).status).toBe("renderable");
  });

  it("needs-setup when required prop is unsupported, with descriptive blocker", () => {
    const props: PropSchema[] = [
      {
        name: "user",
        type: { kind: "unsupported", reason: "object type 'User'" },
        required: true,
      },
    ];
    const result = classify(props);
    expect(result.status).toBe("needs-setup");
    expect(result.blockers).toEqual([
      "prop 'user' is required but its type is unsupported (object type 'User')",
    ]);
  });

  it("collects multiple blockers", () => {
    const props: PropSchema[] = [
      { name: "user", type: { kind: "unsupported", reason: "object" }, required: true },
      { name: "onClick", type: { kind: "unsupported", reason: "function" }, required: true },
    ];
    const result = classify(props);
    expect(result.blockers).toHaveLength(2);
  });
});
