import type { PropSchema } from "../../shared/types.js";

export type PropValue = string | number | boolean;

export function defaultPropValues(
  props: PropSchema[],
): Record<string, PropValue> {
  const out: Record<string, PropValue> = {};
  for (const p of props) {
    if (p.type.kind === "unsupported") continue;
    if (p.defaultValue !== undefined) {
      out[p.name] = p.defaultValue;
      continue;
    }
    out[p.name] = synthesize(p);
  }
  return out;
}

function synthesize(p: PropSchema): PropValue {
  switch (p.type.kind) {
    case "string":
      return "Sample";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "enum":
      return p.type.values[0] as PropValue;
    case "unsupported":
      throw new Error("unreachable");
  }
}
