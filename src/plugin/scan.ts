import path from "node:path";
import { glob } from "tinyglobby";

export interface ScanInput {
  root: string;
  scan: string[];
  ignore: string[];
}

export interface ScannedFile {
  absPath: string;
  relPath: string;
  name: string;
  group: string[];
}

export async function scan(input: ScanInput): Promise<ScannedFile[]> {
  const matches = await glob(input.scan, {
    cwd: input.root,
    ignore: input.ignore,
    onlyFiles: true,
    dot: false,
  });

  return matches
    .map((rel) => normalize(rel, input.root))
    .sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function normalize(rel: string, root: string): ScannedFile {
  const posixRel = rel.split(path.sep).join("/");
  const absPath = path.resolve(root, rel);
  const base = path.basename(posixRel, ".svelte");
  const segments = posixRel.split("/");
  const inner = segments.slice(1, -1);
  return {
    absPath,
    relPath: posixRel,
    name: base,
    group: inner,
  };
}
