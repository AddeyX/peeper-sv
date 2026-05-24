import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

const CANDIDATES = [
  "svelte.config.js",
  "svelte.config.mjs",
  "svelte.config.ts",
];

interface MaybeKitConfig {
  kit?: {
    alias?: Record<string, string>;
    files?: { lib?: string };
  };
}

/**
 * Load aliases from the user's svelte.config.{js,mjs,ts}.
 *
 * Returns aliases with relative `to` paths resolved against the project root.
 * Includes the SvelteKit-default `$lib → src/lib` (or kit.files.lib if set).
 *
 * Best-effort: any load/parse error returns an empty object with a warning.
 */
export async function loadSvelteKitAliases(
  root: string,
): Promise<Record<string, string>> {
  let configPath: string | undefined;
  for (const name of CANDIDATES) {
    const candidate = path.join(root, name);
    if (await exists(candidate)) {
      configPath = candidate;
      break;
    }
  }
  if (!configPath) return {};

  // .ts requires a transpile step we don't ship; skip with a soft note.
  if (configPath.endsWith(".ts")) {
    return {};
  }

  let mod: { default?: MaybeKitConfig } | MaybeKitConfig;
  try {
    mod = await import(pathToFileURL(configPath).href);
  } catch {
    return {};
  }

  const cfg = (mod as { default?: MaybeKitConfig }).default ?? (mod as MaybeKitConfig);
  const out: Record<string, string> = {};

  const libDir = cfg.kit?.files?.lib ?? "src/lib";
  out["$lib"] = path.resolve(root, libDir);

  for (const [key, value] of Object.entries(cfg.kit?.alias ?? {})) {
    if (typeof value !== "string") continue;
    out[key] = path.isAbsolute(value) ? value : path.resolve(root, value);
  }

  return out;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}
