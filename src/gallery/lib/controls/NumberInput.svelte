<script lang="ts">
  let { value = $bindable(0), label }: { value?: number; label: string } = $props();
</script>

<label class="ctrl">
  <span>{label}</span>
  <input type="number" step="1" bind:value />
</label>

<style>
  .ctrl {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  input {
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
  }
</style>
