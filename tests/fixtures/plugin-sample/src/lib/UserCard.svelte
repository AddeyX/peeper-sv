<script lang="ts">
  interface User { id: string; name: string }
  let { user }: { user: User } = $props();
</script>
<div>{user.name}</div>
