export type PropKind =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "enum"; values: (string | number)[] }
  | { kind: "unsupported"; reason: string };

export interface PropSchema {
  name: string;
  type: PropKind;
  required: boolean;
  defaultValue?: string | number | boolean;
  docComment?: string;
}

export type ComponentStatus = "renderable" | "needs-setup";

export interface ComponentEntry {
  /** Stable hash of the component's absolute path. */
  id: string;
  /** File-system component name without extension, e.g. "Button". */
  name: string;
  /** Path relative to the user's project root, e.g. "src/lib/Button.svelte". */
  relPath: string;
  /** Vite-style import path, e.g. "/src/lib/Button.svelte". */
  importPath: string;
  /** Directory segments under src/ used for sidebar grouping. */
  group: string[];
  status: ComponentStatus;
  /** Populated when status === "needs-setup". */
  blockers?: string[];
  props: PropSchema[];
}

export interface Manifest {
  generatedAt: number;
  components: ComponentEntry[];
}

export interface ViewportPreset {
  name: string;
  width: number;
}

export interface PeeperConfig {
  scan?: string[];
  ignore?: string[];
  globalCss?: string[];
  viewports?: ViewportPreset[];
}
