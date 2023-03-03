<template>
  <span v-if="props.line" :class="`mx-0.5 inline-block text-center bg-stone-800 text-white px-1.5 py-0.5 rounded ${resolveLineClass(props.line)}`">
    {{ props.line }}
  </span>
  <img v-else src="@/assets/images/train.svg" class="h-9" />
</template>
<script setup lang="ts">
const props = defineProps<{ line: string }>();

function resolveLineClass (line?: String) {
  return `line--${line ? line.normalize("NFD").replace(/[\u0300-\u036F]/g, "").replace(/[^A-Za-z0-9-]/g, "_") : "default"}`;
}
</script>
