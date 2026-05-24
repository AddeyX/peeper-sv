import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { PeeperConfig } from "../shared/types.js";

export interface LoadConfigInput {
  root: string;
  configPath?: string;
}

const CANDIDATES = [
  "peeper.config.ts",
  "peeper.config.js",
  "peeper.config.mjs",
];

export async function loadPeeperConfig(input: LoadConfigInput): Promise<PeeperConfig> {
  const explicit = input.configPath;
  if (explicit) {
    return importConfig(explicit);
  }

  for (const name of CANDIDATES) {
    const candidate = path.join(input.root, name);
    if (await exists(candidate)) {
      return importConfig(candidate);
    }
  }
  return {};
}

async function importConfig(filePath: string): Promise<PeeperConfig> {
  if (filePath.endsWith(".ts")) {
    throw new Error(
      "peeper.config.ts requires the Vite-aware loader (see Task 10).",
    );
  }
  const url = pathToFileURL(filePath).href;
  const mod = await import(/* @vite-ignore */ url);
  const cfg = (mod.default ?? mod) as PeeperConfig;
  return cfg ?? {};
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}
