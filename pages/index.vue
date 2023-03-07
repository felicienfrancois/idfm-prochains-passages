<template>
  <transition
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
    enter-active-class="transition duration-1000"
    leave-active-class="transition duration-1000"
    :duration="1000"
  >
    <div v-show="loading" class="z-40 absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center bg-stone-50">
      <div class="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-stone-800 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_2s_linear_infinite]">
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">
const loading = ref(!!useRoute().query.standalone);

if (useRoute().query.stops) {
  useRouter().replace((JSON.parse(useRoute().query.stops as string) as string[]).join(","));
}
onMounted(() => {
  if (useRoute().query.standalone && localStorage.getItem("stopIds")) {
    useShowSettings().value = false;
    useRouter().replace(localStorage.getItem("stopIds") as string);
  } else {
    loading.value = false;
  }
});
</script>
