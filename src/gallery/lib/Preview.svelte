<script lang="ts">
  import type { Component } from "svelte";
  import type { ComponentEntry } from "../../shared/types.js";
  import type { PropValue } from "./props-state.js";
  import ViewportPicker from "./ViewportPicker.svelte";
  import NeedsSetupCard from "./NeedsSetupCard.svelte";

  let { entry, props }: {
    entry: ComponentEntry;
    props: Record<string, PropValue>;
  } = $props();

  let width = $state(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Comp = $state<Component<any, any, any> | null>(null);
  let loadError = $state<string | null>(null);

  $effect(() => {
    Comp = null;
    loadError = null;
    if (entry.status === "needs-setup") return;
    const id = entry.id;
    import(/* @vite-ignore */ entry.importPath)
      .then((mod) => {
        if (entry.id === id) Comp = mod.default;
      })
      .catch((err: unknown) => {
        loadError = err instanceof Error ? err.message : String(err);
      });
  });
</script>

<section class="preview">
  <header class="toolbar">
    <ViewportPicker bind:width />
    <span class="muted">{entry.relPath}</span>
  </header>

  <div class="frame">
    {#if entry.status === "needs-setup"}
      <NeedsSetupCard
        name={entry.name}
        relPath={entry.relPath}
        blockers={entry.blockers ?? []}
      />
    {:else if loadError}
      <pre class="error">Failed to load: {loadError}</pre>
    {:else if Comp}
      {@const C = Comp}
      <div class="viewport" style:width={width ? `${width}px` : "auto"}>
        <svelte:boundary>
          <C {...props} />
          {#snippet failed(error: unknown)}
            <pre class="error">{error instanceof Error ? error.stack ?? error.message : String(error)}</pre>
          {/snippet}
        </svelte:boundary>
      </div>
    {:else}
      <p class="muted">Loading…</p>
    {/if}
  </div>
</section>

<style>
  .preview { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .toolbar {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); background: var(--panel);
  }
  .muted { color: var(--muted); font-size: 0.875rem; }
  .frame { flex: 1; overflow: auto; padding: 1rem; background: white; }
  .viewport {
    margin: 0 auto; border: 1px dashed var(--border); padding: 1rem;
    transition: width 0.15s ease;
  }
  .error {
    color: var(--danger); background: #fff5f5; padding: 0.75rem; border-radius: 6px;
    white-space: pre-wrap;
  }
</style>
