<script lang="ts">
  let {
    value = $bindable<string | number>(""),
    label,
    options,
  }: {
    value?: string | number;
    label: string;
    options: (string | number)[];
  } = $props();
</script>

<label class="ctrl">
  <span>{label}</span>
  <select bind:value>
    {#each options as opt}
      <option value={opt}>{opt}</option>
    {/each}
  </select>
</label>

<style>
  .ctrl {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  select {
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
  }
</style>
