import type { PropSchema, ComponentStatus } from "../shared/types.js";

export interface ClassifyResult {
  status: ComponentStatus;
  blockers?: string[];
}

export function classify(props: PropSchema[]): ClassifyResult {
  const blockers: string[] = [];
  for (const p of props) {
    if (p.required && p.type.kind === "unsupported") {
      blockers.push(
        `prop '${p.name}' is required but its type is unsupported (${p.type.reason})`,
      );
    }
  }
  if (blockers.length === 0) {
    return { status: "renderable" };
  }
  return { status: "needs-setup", blockers };
}
