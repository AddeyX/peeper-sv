<script lang="ts">
  import manifest from "virtual:peeper-manifest";
  import type { ComponentEntry } from "../shared/types.js";
  import Sidebar from "./lib/Sidebar.svelte";
  import Preview from "./lib/Preview.svelte";
  import ControlPanel from "./lib/ControlPanel.svelte";
  import { defaultPropValues, type PropValue } from "./lib/props-state.js";
  import { parseHash, encodeHash } from "./lib/hash-router.js";

  let selectedId = $state<string | null>(manifest.components[0]?.id ?? null);
  const selected = $derived(
    manifest.components.find((c: ComponentEntry) => c.id === selectedId) ?? null,
  );

  let values = $state<Record<string, PropValue>>({});

  $effect(() => {
    if (selected) values = defaultPropValues(selected.props);
    else values = {};
  });

  // Initial sync from URL + listen for hashchange
  $effect(() => {
    const init = parseHash(window.location.hash);
    if (init.relPath) {
      const match = manifest.components.find((c: ComponentEntry) => c.relPath === init.relPath);
      if (match) {
        selectedId = match.id;
        queueMicrotask(() => {
          values = { ...values, ...init.props };
        });
      }
    }

    const onHash = (): void => {
      const next = parseHash(window.location.hash);
      const match = next.relPath
        ? manifest.components.find((c: ComponentEntry) => c.relPath === next.relPath)
        : null;
      if (match) selectedId = match.id;
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
    selectedId = id;
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
