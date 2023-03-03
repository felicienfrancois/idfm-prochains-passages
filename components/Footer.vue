<template>
  <div class="flex fixed z-40 bottom-0 h-6 px-1 py-1 w-full bg-stone-300 text-[12px] text-stone-500">
    <span class="mx-2">
      © {{ currentTime.getFullYear() }}
      <span class="hidden md:inline">Félicien François</span>
    </span>
    •
    <span class="mx-2">
      <a href="https://github.com/felicienfrancois/idfm-prochains-passages" class="text-stone-600 underline">
        <span class="hidden md:inline">Code</span>
        source
      </a>
    </span>
    •
    <span class="mx-2">
      <span class="hidden lg:inline">Données fournies par l'</span>
      <a
        href="https://prim.iledefrance-mobilites.fr"
        class="text-stone-600 underline"
      >API Ile de France Mobilité</a>
    </span>
    <span class="grow" />
    <span class="mx-2 hidden sm:inline">{{ displayWidth }}x{{ displayHeight }}</span>
    •
    <span class="mx-2 hidden sm:inline">{{ formatTimeSec(loadTime) }}</span>
    •
    <span class="mx-2 hidden sm:inline">{{ formatTimeSec(lastRefreshTime) }}</span>
    •
    <span class="mx-2 hidden sm:inline">{{ formatTimeSec(currentTime) }}</span>
  </div>
</template>

<script setup lang="ts">
const loadTime = new Date();
const currentTime = useCurrentTime();
const lastRefreshTime = useLastRefreshTime();

const displayWidth = ref(0);
const displayHeight = ref(0);
onMounted(() => {
  displayWidth.value = window.innerWidth;
  displayHeight.value = window.innerHeight;
});
</script>
