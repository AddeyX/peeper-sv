<script lang="ts">
  import manifest from "virtual:peeper-manifest";
  import type { ComponentEntry } from "../shared/types.js";
  import Sidebar from "./lib/Sidebar.svelte";
  import Preview from "./lib/Preview.svelte";
  import ControlPanel from "./lib/ControlPanel.svelte";
  import { defaultPropValues, type PropValue } from "./lib/props-state.js";

  let selectedId = $state<string | null>(manifest.components[0]?.id ?? null);
  const selected = $derived(
    manifest.components.find((c: ComponentEntry) => c.id === selectedId) ?? null,
  );

  let values = $state<Record<string, PropValue>>({});

  $effect(() => {
    if (selected) values = defaultPropValues(selected.props);
    else values = {};
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
