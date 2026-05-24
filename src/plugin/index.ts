import path from "node:path";
import crypto from "node:crypto";
import type { Plugin, ViteDevServer } from "vite";
import { scan } from "./scan.js";
import { introspect } from "./introspect.js";
import { classify } from "./classify.js";
import { buildManifest, manifestToModuleSource } from "./manifest.js";
import type { ComponentEntry, PeeperConfig, Manifest } from "../shared/types.js";

const VIRTUAL_ID = "virtual:peeper-manifest";
const RESOLVED_ID = "\0virtual:peeper-manifest";

const DEFAULT_SCAN = ["src/**/*.svelte"];
const DEFAULT_IGNORE = ["src/routes/**", "**/node_modules/**"];

export interface PeeperPluginOptions extends PeeperConfig {
  /** User project root. Defaults to `process.cwd()`. */
  root?: string;
}

interface InternalState {
  root: string;
  scanGlobs: string[];
  ignoreGlobs: string[];
  manifest: Manifest;
  server?: ViteDevServer;
}

export function peeperPlugin(options: PeeperPluginOptions = {}): Plugin {
  const state: InternalState = {
    root: options.root ?? process.cwd(),
    scanGlobs: options.scan ?? DEFAULT_SCAN,
    ignoreGlobs: options.ignore ?? DEFAULT_IGNORE,
    manifest: { generatedAt: 0, components: [] },
  };

  return {
    name: "peeper-sv:manifest",

    async buildStart() {
      state.manifest = await rebuildManifest(state);
    },

    configureServer(server) {
      state.server = server;
      for (const glob of state.scanGlobs) {
        server.watcher.add(path.join(state.root, glob));
      }
      const refresh = async (file: string) => {
        if (!file.endsWith(".svelte")) return;
        state.manifest = await rebuildManifest(state);
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload", path: "*" });
      };
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
      server.watcher.on("change", (file) => {
        if (file.endsWith(".svelte")) void refreshSingle(state, file);
      });
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    load(id) {
      if (id === RESOLVED_ID) return manifestToModuleSource(state.manifest);
      return null;
    },
  };
}

async function rebuildManifest(state: InternalState): Promise<Manifest> {
  const files = await scan({
    root: state.root,
    scan: state.scanGlobs,
    ignore: state.ignoreGlobs,
  });

  const entries: ComponentEntry[] = [];
  for (const f of files) {
    try {
      const props = await introspect({ absPath: f.absPath, projectRoot: state.root });
      const { status, blockers } = classify(props);
      entries.push({
        id: hashPath(f.absPath),
        name: f.name,
        relPath: f.relPath,
        importPath: "/" + f.relPath,
        group: f.group,
        status,
        ...(blockers ? { blockers } : {}),
        props,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      entries.push({
        id: hashPath(f.absPath),
        name: f.name,
        relPath: f.relPath,
        importPath: "/" + f.relPath,
        group: f.group,
        status: "needs-setup",
        blockers: [`could not parse component: ${reason}`],
        props: [],
      });
    }
  }

  return buildManifest(entries);
}

async function refreshSingle(state: InternalState, absPath: string): Promise<void> {
  try {
    const props = await introspect({ absPath, projectRoot: state.root });
    const { status, blockers } = classify(props);
    const idx = state.manifest.components.findIndex(
      (c) => path.resolve(state.root, c.relPath) === absPath,
    );
    if (idx === -1) return;
    const existing = state.manifest.components[idx]!;
    state.manifest.components[idx] = {
      ...existing,
      status,
      ...(blockers ? { blockers } : { blockers: undefined }),
      props,
    };
    state.manifest = { ...state.manifest, generatedAt: Date.now() };
    if (state.server) {
      const mod = state.server.moduleGraph.getModuleById(RESOLVED_ID);
      if (mod) state.server.moduleGraph.invalidateModule(mod);
      state.server.ws.send({ type: "full-reload", path: "*" });
    }
  } catch {
    // swallow; full rebuild will catch persistent failures
  }
}

function hashPath(absPath: string): string {
  return crypto.createHash("sha1").update(absPath).digest("hex").slice(0, 12);
}
