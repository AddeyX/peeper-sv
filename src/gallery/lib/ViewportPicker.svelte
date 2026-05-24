<script lang="ts">
  import type { ViewportPreset } from "../../shared/types.js";

  const DEFAULTS: ViewportPreset[] = [
    { name: "natural", width: 0 },
    { name: "mobile", width: 375 },
    { name: "tablet", width: 768 },
    { name: "desktop", width: 1280 },
  ];

  let { width = $bindable(0), presets = DEFAULTS }: {
    width?: number;
    presets?: ViewportPreset[];
  } = $props();
</script>

<select bind:value={width}>
  {#each presets as p}
    <option value={p.width}>{p.name}{p.width ? ` (${p.width}px)` : ""}</option>
  {/each}
</select>

<style>
  select {
    padding: 0.3rem 0.5rem; border: 1px solid var(--border); border-radius: 4px;
  }
</style>
