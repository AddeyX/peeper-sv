# peeper-sv — Design Spec

**Date:** 2026-05-24
**Status:** Approved (brainstorming phase)
**Author:** Emmanuel Addey

## 1. Purpose

`peeper-sv` is a zero-config Svelte 5 component gallery. A user runs `npx peeper-sv` from the root of their SvelteKit project. The tool boots a local dev server that scans `src/**/*.svelte`, introspects each component's TypeScript props, and renders an interactive browser-based gallery where every component can be viewed in isolation and poked at via auto-generated controls.

It is conceptually similar to Storybook, but explicitly trades configurability and breadth for zero-setup discovery — useful for onboarding new contributors to a codebase and for existing contributors browsing what components already exist.

## 2. Success Criteria

A user with an existing SvelteKit + TypeScript project can:

1. Run `npx peeper-sv` from the project root with no prior configuration.
2. See every `.svelte` file under `src/` (excluding `src/routes/`) listed in a sidebar within 5 seconds for a 100-component project.
3. Click any component and see it rendered with default props.
4. Edit props via an auto-generated control panel and see the component re-render reactively.
5. See clear "needs setup" messaging for components whose required props cannot be auto-mocked.
6. Get HMR-style live updates when component source files change.

## 3. Scope

### In scope (v1)

- Auto-discovery of `.svelte` files via glob.
- TypeScript-only prop introspection via `svelte2tsx` + TS compiler API.
- Auto-generated controls for primitive prop types (`string`, `number`, `boolean`, string/number literal unions).
- Sidebar with tree grouping by directory and a search/filter box.
- Viewport size picker (mobile/tablet/desktop/natural/custom).
- "Needs setup" card for components with unsupported required props.
- HMR for both component source changes and manifest changes (file add/remove).
- Global CSS auto-detection (`src/app.css`, `src/app.postcss`) plus config override.
- Optional `peeper.config.{js,ts}` for scan globs, ignores, global CSS, viewports.
- CLI flags: `--port`, `--host`, `--open`, `--root`, `--config`, `--scan`, `--ignore`.

### Out of scope (v1)

- Svelte 4 support.
- JS / JSDoc prop introspection (TS only).
- Manual override file for props (e.g. `Component.gallery.ts`).
- Custom story files (e.g. `Component.story.svelte`).
- Vite-plugin mode (CLI-only invocation).
- Dark/light theme toggle inside the gallery shell.
- Export/share snapshots (PNG export, server-rendered shareable links — URL hash state is in scope but no formal export feature).
- Addons system.
- Production build / static export of the gallery.

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│ User project (CWD)                                      │
│   src/**/*.svelte  ──── scanned                         │
│   src/app.css      ──── auto-loaded                     │
│   vite.config.ts   ──── merged                          │
└────────────────────┬────────────────────────────────────┘
                     │  npx peeper-sv
                     ▼
┌─────────────────────────────────────────────────────────┐
│ peeper-sv CLI (node)                                    │
│   1. Resolve user vite config + aliases                 │
│   2. Start Vite dev server programmatically             │
│      - root = gallery shell (inside pkg)                │
│      - custom plugin: peeperPlugin()                    │
│   3. Open browser to http://localhost:<port>            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ peeperPlugin (Vite plugin)                              │
│   - Scan glob src/**/*.svelte (minus src/routes)        │
│   - Parse TS props via svelte2tsx + ts compiler API     │
│   - Emit virtual:peeper-manifest                        │
│   - Watch FS, invalidate manifest on add/remove/change  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Gallery SPA (Svelte 5, shipped in pkg)                  │
│   - Sidebar: tree of components grouped by dir          │
│   - Search box (filter by name/path)                    │
│   - Main: dynamic import of selected component          │
│   - Right panel: auto-generated controls from schema    │
│   - Viewport selector                                   │
│   - "Needs setup" card for unrenderable components      │
└─────────────────────────────────────────────────────────┘
```

Three units with clear boundaries:

- **CLI** (`src/cli.ts`, `src/server.ts`) — process lifecycle, argv parsing, Vite server bootstrapping.
- **Plugin** (`src/plugin/*`) — node-only; component discovery, TS introspection, manifest generation, file watching.
- **Gallery SPA** (`src/gallery/*`) — browser-only; consumes `virtual:peeper-manifest`, renders UI.

Plugin and gallery communicate exclusively via the `virtual:peeper-manifest` module.

## 5. Package Layout

```
peeper-sv/
├── package.json          bin: { "peeper-sv": "./dist/cli.js" }
├── src/
│   ├── cli.ts            entry; parse argv, start server
│   ├── server.ts         programmatic vite createServer()
│   ├── plugin/
│   │   ├── index.ts      peeperPlugin() vite plugin
│   │   ├── scan.ts       glob src/**/*.svelte minus routes
│   │   ├── introspect.ts svelte2tsx + ts compiler → prop schema
│   │   ├── manifest.ts   build virtual module source
│   │   └── classify.ts   renderable | needs-setup decision
│   ├── shared/
│   │   └── types.ts      ComponentEntry, PropSchema, PeeperConfig
│   └── gallery/          svelte 5 SPA shipped to browser
│       ├── index.html
│       ├── main.ts       app mount
│       ├── App.svelte    layout shell
│       ├── lib/
│       │   ├── Sidebar.svelte
│       │   ├── SearchBox.svelte
│       │   ├── Preview.svelte
│       │   ├── ControlPanel.svelte
│       │   ├── ViewportPicker.svelte
│       │   ├── NeedsSetupCard.svelte
│       │   └── controls/
│       │       ├── TextInput.svelte
│       │       ├── NumberInput.svelte
│       │       ├── BoolSwitch.svelte
│       │       └── EnumSelect.svelte
│       └── manifest.d.ts virtual module type
├── tests/
│   ├── unit/             introspect, classify, scan, manifest
│   ├── integration/      plugin against fixture projects
│   ├── e2e/              playwright against full CLI run
│   └── fixtures/
│       └── sample-kit-project/
├── tsconfig.json
└── vitest.config.ts
```

## 6. Core Types

```ts
// src/shared/types.ts

export type PropKind =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "enum"; values: (string | number)[] }
  | { kind: "unsupported"; reason: string };

export interface PropSchema {
  name: string;
  type: PropKind;
  required: boolean;
  defaultValue?: string | number | boolean;
  docComment?: string;
}

export interface ComponentEntry {
  id: string;              // stable hash of absPath
  name: string;            // "Button"
  relPath: string;         // "src/lib/components/Button.svelte"
  importPath: string;      // "/src/lib/components/Button.svelte"
  group: string[];         // ["lib", "components"]
  status: "renderable" | "needs-setup";
  blockers?: string[];     // populated when status === "needs-setup"
  props: PropSchema[];
}

export interface Manifest {
  generatedAt: number;
  components: ComponentEntry[];
}

export interface PeeperConfig {
  scan?: string[];
  ignore?: string[];
  globalCss?: string[];
  viewports?: Array<{ name: string; width: number }>;
}
```

## 7. Data Flow

### Startup

1. CLI parses argv, resolves project root (default CWD).
2. CLI loads user's Vite config via Vite's `loadConfigFromFile`. Plugins, aliases, and CSS pipeline are preserved.
3. CLI merges user config with: root pointing at packaged `gallery/` directory and an appended `peeperPlugin()` instance.
4. CLI calls `createServer(merged)`, starts listening, optionally opens browser.
5. Plugin's `buildStart` hook runs `scan() → introspect() → classify()` and holds the resulting `Manifest` in memory.
6. Plugin serves `virtual:peeper-manifest` as `export default <JSON.stringify(manifest)>`.
7. Browser loads gallery SPA, which imports the manifest and renders the sidebar.

### User selects a component

1. Gallery dynamic-imports the component via Vite using `entry.importPath`.
2. If `status === "needs-setup"`, `<NeedsSetupCard />` renders with the blockers list and a copy-paste import snippet; the component is not mounted.
3. Otherwise, the component is mounted inside `<Preview />` with props derived from the control panel state (defaults applied on first render).
4. Control edits update a `$state` object that is passed reactively to the mounted component.

### File change

1. The plugin uses Vite's `server.watcher` to watch configured globs.
2. On add/remove/rename of a `.svelte` file under scan paths:
   - Re-run scan, then introspect changed/new files (cache unchanged ones by source hash).
   - Rebuild manifest, call `server.moduleGraph.invalidateModule(virtualModule)`.
   - Send HMR update for the virtual module.
3. Gallery handles `import.meta.hot.accept` for the manifest module → sidebar refreshes reactively.
4. Content edits to existing components use normal Vite/Svelte HMR; no manifest rebuild.

## 8. Prop Introspection

For each `.svelte` file:

1. Read source. Locate `<script lang="ts">`. If absent, mark all props `unsupported` (component classification then depends on whether any are required).
2. Use `svelte2tsx` to produce a synthetic `.tsx` exposing props as an exported type.
3. Feed synthetic file into `ts.createProgram` configured from the user's `tsconfig.json` (for path resolution and lib targets). If no tsconfig exists, fall back to an in-memory config (`target: ESNext`, `moduleResolution: Bundler`).
4. Locate the `$props()` call's type argument:
   ```svelte
   let { label, count = 0, variant = 'primary' }: {
     label: string;
     count?: number;
     variant?: 'primary' | 'secondary';
   } = $props();
   ```
5. Walk type properties via the TS checker:
   - `string` / `number` / `boolean` → matching `PropKind`.
   - Union of string or number literals → `{ kind: "enum", values }`.
   - Optional (`?`) or has a default in the destructure → `required: false`.
   - Anything else (object, function, `Snippet`, generic, imported type) → `{ kind: "unsupported", reason }`.
6. Capture JSDoc on each prop via `symbol.getDocumentationComment(checker)` → `docComment`.
7. Capture default value by parsing destructure RHS when it is a literal; omit otherwise.

### Classification

```
status = "needs-setup" IF any prop has:
  required: true AND type.kind === "unsupported"
ELSE "renderable"

blockers[] = human-readable strings for the needs-setup card
            e.g. "prop 'user' required, type User (objects not supported)"
```

### Caching

In-memory only (process lifetime). Per-file cache key = SHA-1 of source. Skip introspection on unchanged files between rebuilds. No disk cache in v1.

## 9. CLI Surface

```
peeper-sv [options]

  --port <n>       default 4321, auto-pick next free if taken
  --host <h>       default localhost
  --open           open browser on start (default true; --no-open to skip)
  --root <path>    user project root (default cwd)
  --config <path>  path to peeper.config.{js,ts} (optional)
  --scan <glob>    override default scan glob (repeatable)
  --ignore <glob>  add ignore pattern (repeatable)
  --version
  --help
```

### Config file (optional)

```ts
// peeper.config.ts
import type { PeeperConfig } from "peeper-sv";

export default {
  scan: ["src/**/*.svelte"],
  ignore: ["src/routes/**", "**/*.test.svelte"],
  globalCss: ["src/app.css"],
  viewports: [
    { name: "mobile",  width: 375  },
    { name: "tablet",  width: 768  },
    { name: "desktop", width: 1280 },
  ],
} satisfies PeeperConfig;
```

Defaults applied for omitted fields. Auto-detection of `src/app.css` and `src/app.postcss` always runs unless `globalCss: []` is set explicitly.

## 10. Gallery UI

### Layout (three panes)

```
┌──────────┬─────────────────────────────┬──────────────┐
│ Sidebar  │ Preview                     │ Controls     │
│          │                             │              │
│ [search] │ ┌─[viewport: desktop ▼]─┐   │ label        │
│          │ │                       │   │ [Hello____]  │
│ ▾ lib    │ │  <Component render>   │   │              │
│   ▾ ui   │ │                       │   │ count        │
│     Btn  │ │                       │   │ [  0  ▲▼]    │
│     Card │ │                       │   │              │
│   Modal  │ └───────────────────────┘   │ variant      │
│ ▾ forms  │                             │ [primary  ▼] │
│   Input  │                             │              │
└──────────┴─────────────────────────────┴──────────────┘
```

### Sidebar

- Tree grouped by directory relative to `src/`.
- Search box filters by component name and `relPath` substring, case-insensitive.
- Selected component persisted in URL hash: `#/lib/ui/Button`.

### Preview pane

- No iframe. Component mounted in a container `<div style="width: {viewportWidth}px">`.
- Viewport picker dropdown: `natural` | `mobile 375` | `tablet 768` | `desktop 1280` | `custom`.
- White background default; no theme toggle.
- Errors caught via `<svelte:boundary>` — failed renders show a red error card with stack; the gallery remains responsive.

### Controls panel

- One input per renderable prop:
  - `string` → text input
  - `number` → number input, `step=1`
  - `boolean` → switch
  - `enum` → select with literal values
- Required props marked with `*`. Defaults pre-filled.
- "Reset" button restores defaults.
- `docComment` shown as a tooltip under the label.

### Needs-setup card

Replaces the preview. Lists `blockers[]`, shows component path, and a copy-paste import snippet template the user can adapt.

### URL state

`#/path/to/Component?prop1=foo&prop2=true` — shareable within a team even without a formal export feature.

## 11. Error Handling

| Failure                              | Behavior                                                                                  |
|--------------------------------------|-------------------------------------------------------------------------------------------|
| User vite config load fails          | CLI prints error + path, exits 1 before server start                                      |
| Port taken                           | Auto-pick next free port, log new port                                                    |
| Single `.svelte` parse fails         | Log warn, mark file `needs-setup` with blocker, continue                                  |
| `svelte2tsx` throws on file          | Same — mark needs-setup, continue                                                         |
| Component throws on mount            | `<svelte:boundary>` in `Preview.svelte` shows red card with stack; gallery stays alive    |
| Component throws on prop update      | Boundary retains last good render and shows error overlay                                 |
| Manifest virtual module fails        | Plugin returns stub `{ components: [] }` + logs; gallery shows "Scan failed" banner       |
| FS watcher dies                      | Plugin re-creates watcher once; on second death, logs + falls back to manual-reload prompt|
| User project has no `.svelte` files  | Gallery loads empty state: "No components found. Tried: <globs>. Adjust via --scan."      |
| `tsconfig.json` missing              | Use minimal in-memory tsconfig (`target: ESNext`, `moduleResolution: Bundler`); continue  |

**Principle:** never crash the dev server because of user code. Server crashes are reserved for: bad CLI args, bad user vite config, port-bind failure after auto-pick exhausts the search range.

## 12. Testing Strategy

### Unit (vitest) — `tests/unit/`

- `introspect.test.ts` — canned `.svelte` source strings; assert `PropSchema` output. Cover each primitive, enum union, optional vs required, required-with-default, JSDoc capture, unsupported types (object, function, `Snippet`, generic).
- `classify.test.ts` — feed `PropSchema` arrays; assert renderable vs needs-setup + blockers list.
- `scan.test.ts` — point at fixture directory tree; assert glob results minus routes minus ignores.
- `manifest.test.ts` — assert virtual module source generation is deterministic given the same input.

### Integration (vitest + tmp dirs) — `tests/integration/`

- Instantiate `peeperPlugin()` against fixture projects on disk; call Vite `transform`/`load` hooks directly; assert manifest output.
- File-watch test: write fixture, create plugin, mutate file, assert manifest update fires.

### E2E (playwright) — `tests/e2e/`

- Boot CLI against `tests/fixtures/sample-kit-project/`.
- Assert: sidebar lists components; click renders; control input mutates preview; search filters; viewport resizes; needs-setup card shows for the bad component; URL hash updates.

### Fixtures — `tests/fixtures/sample-kit-project/`

Real SvelteKit skeleton committed to the repo. Components: `Button.svelte`, `Card.svelte`, `UserProfile.svelte` (needs-setup: requires `user: User`), `Badge.svelte` (enum variant), `Tooltip.svelte` (JSDoc'd).

### CI

GitHub Actions matrix on Node 20 and 22. Unit and integration tests on every push; e2e tests on PR and main.

## 13. Open Questions

None at this time. Spec is ready for plan-writing phase.
