<template>
  <div />
</template>
<script setup lang="ts">
if (useRoute().query.stops) {
  useRouter().replace((JSON.parse(useRoute().query.stops as string) as string[]).join(","));
}
onMounted(() => {
  if (useRoute().query.standalone && localStorage.getItem("stopIds")) {
    useShowSettings().value = false;
    useRouter().replace(localStorage.getItem("stopIds") as string);
  }
});
</script>
