import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { introspect } from "../../src/plugin/introspect.js";

async function introspectSource(src: string) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "peeper-introspect-"));
  const file = path.join(dir, "Comp.svelte");
  await fs.writeFile(file, src, "utf8");
  return introspect({ absPath: file, projectRoot: dir });
}

describe("introspect", () => {
  it("extracts string, number, boolean props from $props()", async () => {
    const src = `
<script lang="ts">
  let { label, count = 0, disabled = false }: {
    label: string;
    count?: number;
    disabled?: boolean;
  } = $props();
</script>
<button>{label}</button>
`;
    const props = await introspectSource(src);
    expect(props).toEqual([
      { name: "label", type: { kind: "string" }, required: true },
      {
        name: "count",
        type: { kind: "number" },
        required: false,
        defaultValue: 0,
      },
      {
        name: "disabled",
        type: { kind: "boolean" },
        required: false,
        defaultValue: false,
      },
    ]);
  });

  it("extracts string-literal union as enum", async () => {
    const src = `
<script lang="ts">
  let { variant }: { variant: 'primary' | 'secondary' | 'ghost' } = $props();
</script>
`;
    const props = await introspectSource(src);
    expect(props).toEqual([
      {
        name: "variant",
        type: { kind: "enum", values: ["primary", "secondary", "ghost"] },
        required: true,
      },
    ]);
  });

  it("extracts numeric-literal union as enum", async () => {
    const src = `
<script lang="ts">
  let { size = 1 }: { size?: 1 | 2 | 3 } = $props();
</script>
`;
    const props = await introspectSource(src);
    expect(props[0]?.type).toEqual({ kind: "enum", values: [1, 2, 3] });
    expect(props[0]?.required).toBe(false);
    expect(props[0]?.defaultValue).toBe(1);
  });

  it("marks objects/functions/snippets as unsupported", async () => {
    const src = `
<script lang="ts">
  import type { Snippet } from "svelte";
  interface User { id: string; name: string }
  let { user, onSelect, body }: {
    user: User;
    onSelect: (id: string) => void;
    body?: Snippet;
  } = $props();
</script>
`;
    const props = await introspectSource(src);
    const byName = Object.fromEntries(props.map((p) => [p.name, p]));
    expect(byName.user?.type.kind).toBe("unsupported");
    expect(byName.user?.required).toBe(true);
    expect(byName.onSelect?.type.kind).toBe("unsupported");
    expect(byName.body?.type.kind).toBe("unsupported");
    expect(byName.body?.required).toBe(false);
  });

  it("captures JSDoc comments per prop", async () => {
    const src = `
<script lang="ts">
  let { label }: {
    /** The visible button text. */
    label: string;
  } = $props();
</script>
`;
    const props = await introspectSource(src);
    expect(props[0]?.docComment).toBe("The visible button text.");
  });

  it("returns empty array when component has no <script lang='ts'>", async () => {
    const src = `<button>hi</button>`;
    expect(await introspectSource(src)).toEqual([]);
  });

  it("returns empty array when component uses plain <script> without TS", async () => {
    const src = `<script>let x = 1;</script><div>{x}</div>`;
    expect(await introspectSource(src)).toEqual([]);
  });
});
