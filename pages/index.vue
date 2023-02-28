<template>
  <div>Bienvenue</div>
</template>
<script setup lang="ts">
if (useRoute().query.stops) {
  useRouter().replace((JSON.parse(useRoute().query.stops as string) as string[]).join(","))
}
</script>