<script lang="ts">
  let { value = $bindable("") }: { value?: string } = $props();
</script>

<input
  class="search"
  type="search"
  placeholder="Search components…"
  bind:value
/>

<style>
  .search {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: white;
  }
</style>
