<script lang="ts">
  import type { PropSchema } from "../../shared/types.js";
  import { defaultPropValues, type PropValue } from "./props-state.js";
  import TextInput from "./controls/TextInput.svelte";
  import NumberInput from "./controls/NumberInput.svelte";
  import BoolSwitch from "./controls/BoolSwitch.svelte";
  import EnumSelect from "./controls/EnumSelect.svelte";

  let {
    props,
    values = $bindable<Record<string, PropValue>>({}),
  }: {
    props: PropSchema[];
    values?: Record<string, PropValue>;
  } = $props();

  function reset(): void {
    values = defaultPropValues(props);
  }
</script>

<aside class="panel">
  <header>
    <strong>Props</strong>
    <button class="reset" onclick={reset}>Reset</button>
  </header>
  <div class="rows">
    {#each props as p (p.name)}
      {#if p.type.kind !== "unsupported"}
        <div class="row" title={p.docComment ?? ""}>
          {#if p.type.kind === "string"}
            <TextInput
              label={(p.required ? "* " : "") + p.name}
              bind:value={values[p.name] as string}
            />
          {:else if p.type.kind === "number"}
            <NumberInput
              label={(p.required ? "* " : "") + p.name}
              bind:value={values[p.name] as number}
            />
          {:else if p.type.kind === "boolean"}
            <BoolSwitch
              label={(p.required ? "* " : "") + p.name}
              bind:value={values[p.name] as boolean}
            />
          {:else if p.type.kind === "enum"}
            <EnumSelect
              label={(p.required ? "* " : "") + p.name}
              options={p.type.values}
              bind:value={values[p.name] as string | number}
            />
          {/if}
        </div>
      {/if}
    {/each}
    {#if props.length === 0}
      <p class="muted">No props.</p>
    {/if}
  </div>
</aside>

<style>
  .panel {
    width: 280px;
    border-left: 1px solid var(--border);
    background: var(--panel);
    padding: 0.75rem;
    overflow-y: auto;
  }
  header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }
  .reset {
    background: white;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    font-size: 0.8rem;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .muted {
    color: var(--muted);
    font-size: 0.875rem;
  }
</style>
