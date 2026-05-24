<script lang="ts">
  import manifest from "virtual:peeper-manifest";
  import type { ComponentEntry } from "../shared/types.js";
  import Sidebar from "./lib/Sidebar.svelte";
  import Preview from "./lib/Preview.svelte";
  import ControlPanel from "./lib/ControlPanel.svelte";
  import { defaultPropValues, type PropValue } from "./lib/props-state.js";
  import { parseHash, encodeHash } from "./lib/hash-router.js";

  // Resolve initial selection from URL hash before mount so first render is stable.
  const initialHash =
    typeof window !== "undefined" ? parseHash(window.location.hash) : { relPath: null, props: {} };
  const initialFromHash = initialHash.relPath
    ? manifest.components.find((c: ComponentEntry) => c.relPath === initialHash.relPath)
    : undefined;
  const initialEntry = initialFromHash ?? manifest.components[0];

  let selectedId = $state<string | null>(initialEntry?.id ?? null);
  const selected = $derived(
    manifest.components.find((c: ComponentEntry) => c.id === selectedId) ?? null,
  );

  let values = $state<Record<string, PropValue>>(
    initialEntry
      ? { ...defaultPropValues(initialEntry.props), ...initialHash.props }
      : {},
  );

  function selectById(id: string | null): void {
    selectedId = id;
    const entry = id
      ? manifest.components.find((c: ComponentEntry) => c.id === id)
      : null;
    values = entry ? defaultPropValues(entry.props) : {};
  }

  // Listen for hashchange (e.g. browser back/forward).
  $effect(() => {
    const onHash = (): void => {
      const next = parseHash(window.location.hash);
      const match = next.relPath
        ? manifest.components.find((c: ComponentEntry) => c.relPath === next.relPath)
        : null;
      if (match && match.id !== selectedId) {
        selectedId = match.id;
        values = { ...defaultPropValues(match.props), ...next.props };
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  });

  // Push state up to URL when selection or values change
  $effect(() => {
    if (!selected) return;
    const next = encodeHash(selected.relPath, values);
    if (next !== window.location.hash) {
      history.replaceState(null, "", next);
    }
  });

  function onSelect(id: string): void {
    selectById(id);
  }
</script>

<div class="shell">
  <header class="topbar">
    <strong>peeper-sv</strong>
    <span class="muted">{manifest.components.length} components</span>
  </header>
  <div class="body">
    <Sidebar entries={manifest.components} {selectedId} {onSelect} />
    {#if selected}
      <Preview entry={selected} props={values} />
      <ControlPanel props={selected.props} bind:values />
    {:else}
      <main class="empty">
        <p>No components found. Try adjusting <code>--scan</code> or <code>--ignore</code>.</p>
      </main>
    {/if}
  </div>
</div>

<style>
  .shell { display: flex; flex-direction: column; height: 100%; }
  .topbar {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);
    background: var(--panel);
  }
  .muted { color: var(--muted); font-size: 0.875rem; }
  .body { display: flex; flex: 1; overflow: hidden; }
  .empty { flex: 1; padding: 2rem; }
</style>
