<script lang="ts">
  let { name, relPath, blockers }: {
    name: string;
    relPath: string;
    blockers: string[];
  } = $props();

  const OPEN = "<" + "script lang=\"ts\">";
  const CLOSE = "<" + "/script>";
  const snippet = $derived(
    `${OPEN}\n  import ${name} from "/${relPath}";\n${CLOSE}\n\n<${name} {/* fill in props */} />\n`,
  );
</script>

<div class="card">
  <h3>{name}</h3>
  <p class="muted">{relPath}</p>
  <p>This component can't be auto-rendered because:</p>
  <ul>
    {#each blockers as b}
      <li><code>{b}</code></li>
    {/each}
  </ul>
  <p>Use this snippet as a starting point in your code:</p>
  <pre>{snippet}</pre>
</div>

<style>
  .card {
    border: 1px solid #f0c674; background: #fffbeb;
    padding: 1rem; border-radius: 8px; max-width: 720px;
  }
  .muted { color: var(--muted); font-size: 0.875rem; }
  ul { padding-left: 1.25rem; }
  pre { background: white; border: 1px solid var(--border); padding: 0.75rem; border-radius: 6px; overflow: auto; }
</style>
