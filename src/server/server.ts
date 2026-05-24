import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createServer,
  loadConfigFromFile,
  type InlineConfig,
} from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import getPort from "get-port";
import pc from "picocolors";
import { peeperPlugin } from "../plugin/index.js";
import { loadPeeperConfig } from "./load-config.js";
import { resolveGlobalCss } from "./global-css.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface StartServerInput {
  root: string;
  port: number;
  host: string;
  open: boolean;
  configPath?: string;
  scanOverride?: string[];
  ignoreExtra?: string[];
}

export async function startServer(input: StartServerInput): Promise<void> {
  const resolvedGalleryRoot = await firstExisting([
    path.resolve(__dirname, "../gallery"),
  ]);

  const peeperCfg = await loadPeeperConfig({
    root: input.root,
    configPath: input.configPath,
  });
  const mergedScan = input.scanOverride ?? peeperCfg.scan;
  const mergedIgnore = [
    ...(peeperCfg.ignore ?? []),
    ...(input.ignoreExtra ?? []),
  ];
  const globalCssPaths = await resolveGlobalCss({
    root: input.root,
    configured: peeperCfg.globalCss,
  });

  // Best-effort: borrow user's vite aliases (e.g. $lib remap), nothing else.
  // Merging the user's full config caused dep-optimization to scan their entire
  // dependency graph and choke on pre-compiled Svelte packages (bits-ui,
  // convex-svelte, etc.). The gallery only needs aliases for user-component
  // imports to resolve correctly.
  let userAliasObj: Record<string, string> | undefined;
  try {
    const userViteResult = await loadConfigFromFile(
      { command: "serve", mode: "development" },
      undefined,
      input.root,
    );
    const userAliasRaw = userViteResult?.config.resolve?.alias;
    userAliasObj = Array.isArray(userAliasRaw)
      ? undefined
      : (userAliasRaw as Record<string, string> | undefined);
  } catch (err) {
    // User vite config is broken or missing — fine, fall back to defaults.
    console.warn(
      pc.yellow(
        `peeper-sv: could not load user vite config (${
          err instanceof Error ? err.message : String(err)
        }). Continuing with default aliases.`,
      ),
    );
  }

  const port = await getPort({ port: rangeOf(input.port, 20) });

  const galleryConfig: InlineConfig = {
    root: resolvedGalleryRoot,
    configFile: false,
    server: {
      port,
      host: input.host,
      open: input.open,
      fs: {
        allow: [input.root, path.resolve(resolvedGalleryRoot, "..")],
      },
    },
    plugins: [
      svelte(),
      peeperPlugin({
        root: input.root,
        scan: mergedScan,
        ignore: mergedIgnore.length ? mergedIgnore : undefined,
      }),
      virtualGlobalCss(globalCssPaths),
    ],
    resolve: {
      alias: {
        $lib: path.join(input.root, "src/lib"),
        ...(userAliasObj ?? {}),
      },
    },
    // Prevent Vite from auto-scanning the user's dependency graph for
    // optimization. The gallery shell has only svelte runtime deps; user
    // components load lazily via /@fs/... at runtime. Scanning user deps was
    // causing crashes on pre-compiled Svelte packages.
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
  };

  const server = await createServer(galleryConfig);
  await server.listen();
  server.printUrls();
  console.log(pc.dim("\npeeper-sv ready — press Ctrl+C to stop\n"));
}

function rangeOf(start: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => start + i);
}

async function firstExisting(paths: string[]): Promise<string> {
  const fs = await import("node:fs/promises");
  for (const p of paths) {
    try {
      await fs.stat(p);
      return p;
    } catch {
      /* try next */
    }
  }
  throw new Error(`Gallery root not found. Tried: ${paths.join(", ")}`);
}

function virtualGlobalCss(paths: string[]) {
  const VID = "virtual:peeper-global-css";
  const RID = "\0" + VID;
  return {
    name: "peeper-sv:global-css",
    resolveId(id: string): string | null {
      return id === VID ? RID : null;
    },
    load(id: string): string | null {
      if (id !== RID) return null;
      return paths.map((p) => `import ${JSON.stringify(p)};`).join("\n");
    },
  };
}
