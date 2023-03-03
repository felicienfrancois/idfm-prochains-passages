<template>
  <div :class="`text-4xl text-center font-bold ${colorClass}`">
    {{ props.platform_name }}
  </div>
  <div class="text-[8px] text-center -mt-1">
    Voie
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ platform_name: string }>();

const platformColors = [
  "text-yellow-900",
  "text-sky-800",
  "text-orange-800",
  "text-purple-800",
  "text-teal-800"
];

const colorClass = computed(() => platformColors[(parseInt(props.platform_name, 36) || 0) % platformColors.length]);

</script>
