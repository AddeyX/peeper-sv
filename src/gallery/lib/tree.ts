import type { ComponentEntry } from "../../shared/types.js";

export interface DirNode {
  name: string;
  dirs: DirNode[];
  files: ComponentEntry[];
}

export function buildTree(entries: ComponentEntry[]): DirNode {
  const root: DirNode = { name: "", dirs: [], files: [] };
  for (const e of entries) {
    let cursor = root;
    for (const seg of e.group) {
      let next = cursor.dirs.find((d) => d.name === seg);
      if (!next) {
        next = { name: seg, dirs: [], files: [] };
        cursor.dirs.push(next);
      }
      cursor = next;
    }
    cursor.files.push(e);
  }
  sort(root);
  return root;
}

export function filterTree(node: DirNode, query: string): DirNode {
  const q = query.trim().toLowerCase();
  if (!q) return node;
  return prune(node, q) ?? { name: node.name, dirs: [], files: [] };
}

function prune(node: DirNode, q: string): DirNode | null {
  const files = node.files.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.relPath.toLowerCase().includes(q),
  );
  const dirs: DirNode[] = [];
  for (const d of node.dirs) {
    const pruned = prune(d, q);
    if (pruned) dirs.push(pruned);
  }
  if (files.length === 0 && dirs.length === 0) return null;
  return { name: node.name, dirs, files };
}

function sort(node: DirNode): void {
  node.dirs.sort((a, b) => a.name.localeCompare(b.name));
  node.files.sort((a, b) => a.name.localeCompare(b.name));
  for (const d of node.dirs) sort(d);
}
