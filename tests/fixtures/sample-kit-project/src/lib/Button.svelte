<script lang="ts">
  let { label, disabled = false }: { label: string; disabled?: boolean } = $props();
</script>
<button class="kit-marker" data-testid="btn" {disabled}>{label}</button>
