# peeper-sv

Zero-config Svelte 5 component gallery. Run it inside any SvelteKit project to browse every component with auto-generated prop controls.

```bash
npx peeper-sv
```

## Features

- Auto-discovers `.svelte` files under `src/` (excluding `src/routes/`).
- Auto-generated controls for primitive prop types (string, number, boolean, string/number literal unions).
- Auto-detects `src/app.css` / `src/app.postcss` so your styles come along for free.
- Reuses your `vite.config` and aliases.
- Live updates via Vite HMR when component source changes.
- "Needs setup" card for components whose required props can't be auto-mocked.

## Requirements

- Node 20+
- Svelte 5
- SvelteKit project (or any Vite + Svelte project)
- TypeScript-typed `$props()` for full control panel support

## CLI

```
peeper-sv [options]

  --port <n>       default 4321 (auto-pick if taken)
  --host <h>       default localhost
  --no-open        do not open browser on start
  --root <path>    project root (default cwd)
  --config <path>  path to peeper.config.{js,ts}
  --scan <glob>    override scan glob (repeatable)
  --ignore <glob>  add ignore pattern (repeatable)
```

## Config (optional)

`peeper.config.js`:

```js
export default {
  scan: ["src/**/*.svelte"],
  ignore: ["src/routes/**", "**/*.test.svelte"],
  globalCss: ["src/app.css"],
  viewports: [
    { name: "mobile",  width: 375 },
    { name: "tablet",  width: 768 },
    { name: "desktop", width: 1280 },
  ],
};
```

## License

MIT
