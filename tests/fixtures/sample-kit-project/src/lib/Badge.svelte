<script lang="ts">
  let { variant = "primary" }: { variant?: "primary" | "success" | "danger" } = $props();
</script>
<span data-testid="badge" data-variant={variant}>{variant}</span>
