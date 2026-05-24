import { describe, it, expect } from "vitest";
import { buildTree, filterTree } from "../../src/gallery/lib/tree.js";
import type { ComponentEntry } from "../../src/shared/types.js";

const entries: ComponentEntry[] = [
  { id: "1", name: "Button", relPath: "src/lib/Button.svelte", importPath: "/src/lib/Button.svelte",
    group: ["lib"], status: "renderable", props: [] },
  { id: "2", name: "Card", relPath: "src/lib/ui/Card.svelte", importPath: "/src/lib/ui/Card.svelte",
    group: ["lib", "ui"], status: "renderable", props: [] },
  { id: "3", name: "Input", relPath: "src/forms/Input.svelte", importPath: "/src/forms/Input.svelte",
    group: ["forms"], status: "renderable", props: [] },
];

describe("buildTree", () => {
  it("groups entries by directory path", () => {
    const tree = buildTree(entries);
    expect(tree.dirs.map((d) => d.name)).toEqual(["forms", "lib"]);
    const lib = tree.dirs.find((d) => d.name === "lib")!;
    expect(lib.files.map((f) => f.name)).toEqual(["Button"]);
    expect(lib.dirs.map((d) => d.name)).toEqual(["ui"]);
    expect(lib.dirs[0]!.files.map((f) => f.name)).toEqual(["Card"]);
  });
});

describe("filterTree", () => {
  it("returns matches by name substring (case-insensitive)", () => {
    const tree = buildTree(entries);
    const filtered = filterTree(tree, "but");
    const flat = flatten(filtered);
    expect(flat).toEqual(["Button"]);
  });

  it("returns all when query is empty", () => {
    const tree = buildTree(entries);
    const filtered = filterTree(tree, "");
    expect(flatten(filtered).sort()).toEqual(["Button", "Card", "Input"]);
  });

  it("matches by relPath substring", () => {
    const tree = buildTree(entries);
    expect(flatten(filterTree(tree, "forms/")).sort()).toEqual(["Input"]);
  });
});

function flatten(t: { dirs: any[]; files: any[] }): string[] {
  const out: string[] = t.files.map((f: any) => f.name);
  for (const d of t.dirs) out.push(...flatten(d));
  return out.sort();
}
