import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createServer,
  loadConfigFromFile,
  type InlineConfig,
  type Plugin,
  type PluginOption,
} from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import getPort from "get-port";
import pc from "picocolors";
import { peeperPlugin } from "../plugin/index.js";
import { loadPeeperConfig } from "./load-config.js";
import { resolveGlobalCss } from "./global-css.js";
import { loadSvelteKitAliases } from "./sveltekit-aliases.js";

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

  // Borrow aliases + CSS/asset-related plugins (Tailwind, PostCSS, etc.)
  // from the user's vite.config. Filter out plugins that would conflict
  // with our gallery shell (sveltekit, vite-plugin-svelte — we add our
  // own controlled instance).
  let viteAliasObj: Record<string, string> | undefined;
  let viteCssCfg: InlineConfig["css"];
  let userPlugins: Plugin[] = [];
  try {
    const userViteResult = await loadConfigFromFile(
      { command: "serve", mode: "development" },
      undefined,
      input.root,
    );
    const userAliasRaw = userViteResult?.config.resolve?.alias;
    viteAliasObj = Array.isArray(userAliasRaw)
      ? undefined
      : (userAliasRaw as Record<string, string> | undefined);
    viteCssCfg = userViteResult?.config.css;
    userPlugins = filterUserPlugins(userViteResult?.config.plugins ?? []);
  } catch (err) {
    console.warn(
      pc.yellow(
        `peeper-sv: could not load user vite config (${
          err instanceof Error ? err.message : String(err)
        }). Continuing without user vite config.`,
      ),
    );
  }
  const kitAliasObj = await loadSvelteKitAliases(input.root);

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
      ...userPlugins,
      svelte(),
      peeperPlugin({
        root: input.root,
        scan: mergedScan,
        ignore: mergedIgnore.length ? mergedIgnore : undefined,
      }),
      virtualGlobalCss(globalCssPaths),
    ],
    css: viteCssCfg,
    resolve: {
      alias: {
        // Default $lib first, then svelte.config kit.alias (incl. its own
        // $lib if set), then vite.config resolve.alias on top — latter wins.
        $lib: path.join(input.root, "src/lib"),
        ...kitAliasObj,
        ...(viteAliasObj ?? {}),
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

/**
 * Walk a vite plugins array (which may contain nested arrays / promises /
 * falsy entries) and drop plugins that would conflict with the gallery
 * shell: anything from @sveltejs/vite-plugin-svelte (we add our own) or
 * SvelteKit's runtime plugins (which expect a SvelteKit app, not a gallery).
 */
function filterUserPlugins(plugins: readonly PluginOption[]): Plugin[] {
  const out: Plugin[] = [];
  const SKIP_PREFIXES = [
    "vite-plugin-svelte",         // @sveltejs/vite-plugin-svelte
    "vite-plugin-sveltekit",      // SvelteKit core plugins
    "sveltekit",                  // sveltekit() top-level marker
  ];
  const walk = (p: PluginOption): void => {
    if (!p || typeof p === "boolean") return;
    if (Array.isArray(p)) {
      for (const child of p) walk(child);
      return;
    }
    // Promises / async plugin options — we synchronously read, so skip.
    if (typeof (p as { then?: unknown }).then === "function") return;
    const plugin = p as Plugin;
    const name = plugin.name ?? "";
    if (SKIP_PREFIXES.some((prefix) => name.startsWith(prefix))) return;
    out.push(plugin);
  };
  for (const p of plugins) walk(p);
  return out;
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
