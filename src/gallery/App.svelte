<script lang="ts">
  import manifest from "virtual:peeper-manifest";
  import type { ComponentEntry } from "../shared/types.js";
  import Sidebar from "./lib/Sidebar.svelte";

  let selectedId = $state<string | null>(manifest.components[0]?.id ?? null);
  const selected = $derived(
    manifest.components.find((c: ComponentEntry) => c.id === selectedId) ?? null,
  );

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
    <main class="main">
      {#if selected}
        <h2>{selected.name}</h2>
        <p class="muted">{selected.relPath}</p>
        <pre>{JSON.stringify(selected.props, null, 2)}</pre>
      {:else}
        <p>No components found.</p>
      {/if}
    </main>
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
  .main { flex: 1; padding: 1rem; overflow: auto; }
  pre { background: var(--panel); padding: 0.75rem; border-radius: 6px; overflow: auto; }
</style>
