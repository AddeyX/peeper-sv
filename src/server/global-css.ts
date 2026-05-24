import path from "node:path";
import fs from "node:fs/promises";

const AUTO_CANDIDATES = ["src/app.css", "src/app.postcss"];

export interface ResolveGlobalCssInput {
  root: string;
  /** undefined = autodetect; [] = explicitly disable; [paths] = autodetect + paths */
  configured: string[] | undefined;
}

export async function resolveGlobalCss(
  input: ResolveGlobalCssInput,
): Promise<string[]> {
  if (input.configured && input.configured.length === 0) return [];

  const auto: string[] = [];
  for (const rel of AUTO_CANDIDATES) {
    const p = path.join(input.root, rel);
    if (await exists(p)) auto.push(p);
  }

  const fromConfig = (input.configured ?? []).map((rel) =>
    path.isAbsolute(rel) ? rel : path.join(input.root, rel),
  );

  return Array.from(new Set([...auto, ...fromConfig]));
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}
