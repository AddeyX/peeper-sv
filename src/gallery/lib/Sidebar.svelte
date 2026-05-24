<script lang="ts">
  import type { ComponentEntry } from "../../shared/types.js";
  import { buildTree, filterTree, type DirNode } from "./tree.js";
  import SearchBox from "./SearchBox.svelte";

  let { entries, selectedId, onSelect }: {
    entries: ComponentEntry[];
    selectedId: string | null;
    onSelect: (id: string) => void;
  } = $props();

  let query = $state("");
  const tree = $derived(filterTree(buildTree(entries), query));
</script>

<aside class="sidebar">
  <div class="search-wrap">
    <SearchBox bind:value={query} />
  </div>
  <nav class="tree">
    {#snippet branch(node: DirNode, depth: number)}
      {#each node.dirs as d (d.name)}
        <div class="dir" style="padding-left: {depth * 12}px">▾ {d.name}</div>
        {@render branch(d, depth + 1)}
      {/each}
      {#each node.files as f (f.id)}
        <button
          class="file"
          class:selected={f.id === selectedId}
          style="padding-left: {depth * 12 + 16}px"
          onclick={() => onSelect(f.id)}
        >
          {f.name}
          {#if f.status === "needs-setup"}
            <span class="badge" title="needs setup">⚠︎</span>
          {/if}
        </button>
      {/each}
    {/snippet}
    {@render branch(tree, 0)}
  </nav>
</aside>

<style>
  .sidebar {
    width: 260px;
    border-right: 1px solid var(--border);
    background: var(--panel);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .search-wrap { padding: 0.75rem; }
  .tree { overflow-y: auto; padding-bottom: 1rem; }
  .dir { padding: 0.25rem 0.75rem; color: var(--muted); font-size: 0.85rem; }
  .file {
    display: block; width: 100%; text-align: left;
    background: transparent; border: 0; padding: 0.35rem 0.75rem;
    color: var(--text); border-radius: 0;
  }
  .file:hover { background: rgba(0,0,0,0.04); }
  .file.selected { background: var(--accent); color: white; }
  .badge { float: right; color: #d97706; }
</style>
