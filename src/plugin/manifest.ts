import type { ComponentEntry, Manifest } from "../shared/types.js";

export function buildManifest(components: ComponentEntry[]): Manifest {
  return {
    generatedAt: Date.now(),
    components,
  };
}

export function manifestToModuleSource(m: Manifest): string {
  return `export default ${JSON.stringify(m)};\n`;
}
