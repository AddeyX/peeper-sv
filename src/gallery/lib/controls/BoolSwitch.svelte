<script lang="ts">
  let { value = $bindable(false), label }: { value?: boolean; label: string } = $props();
</script>

<label class="ctrl">
  <input type="checkbox" bind:checked={value} />
  <span>{label}</span>
</label>

<style>
  .ctrl {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
</style>
