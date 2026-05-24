<script lang="ts">
  interface User { name: string }
  let { user }: { user: User } = $props();
</script>
<div>{user.name}</div>
