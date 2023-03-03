<template>
  <span v-if="remainingTime > 1" :class="{ 'text-4xl': true, 'text-stone-900 animate-pulse': remainingTime < 5}">
    <span>{{ remainingTime }}</span>
    <span class="text-sm">min</span>
  </span>
  <span v-else>A&nbsp;l'approche</span>
</template>

<script setup lang="ts">
const props = defineProps<{ date: string|Date }>();

const remainingTime = computed(() => Math.round(
  (new Date(props.date).getTime() - useCurrentTime().value.getTime()) / 60000
));
</script>
