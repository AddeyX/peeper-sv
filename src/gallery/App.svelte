<script lang="ts">
  import manifest from "virtual:peeper-manifest";
</script>

<div class="shell">
  <header class="topbar">
    <strong>peeper-sv</strong>
    <span class="muted">{manifest.components.length} components</span>
  </header>
  <main class="content">
    <p>Gallery scaffolded. Sidebar + preview wired in next tasks.</p>
  </main>
</div>

<style>
  .shell { display: flex; flex-direction: column; height: 100%; }
  .topbar {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);
    background: var(--panel);
  }
  .muted { color: var(--muted); font-size: 0.875rem; }
  .content { padding: 1rem; }
</style>
