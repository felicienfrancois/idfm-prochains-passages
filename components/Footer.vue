<template>
  <div class="flex fixed z-40 bottom-0 h-5 px-1 py-1 w-full bg-stone-300 text-[10px] text-stone-500">
    <div>
      <span class="mx-2">
        © {{ currentTime.getFullYear() }}
        <span class="hidden sm:inline">Félicien François</span>
      </span>
      <span>•</span>
      <a href="https://prochains-passages.fr" class="mx-2 text-stone-600 underline">prochains-passages.fr</a>
      <span class="hidden lg:inline">•</span>
      <a href="https://github.com/felicienfrancois/idfm-prochains-passages" class="hidden lg:inline mx-2 text-stone-600 underline">Code source</a>
      <span>•</span>
      <span class="mx-2">
        <span class="hidden lg:inline">Données fournies par l'</span>
        <a
          href="https://prim.iledefrance-mobilites.fr"
          class="text-stone-600 underline"
        >API <span class="hidden sm:inline">Ile de France</span><span class="sm:hidden">IDF</span> Mobilité</a>
      </span>
    </div>
    <div class="grow" />
    <div class="hidden md:inline">
      <span class="mx-2">{{ displayWidth }}x{{ displayHeight }}</span>
      <span>•</span>
      <span class="mx-2">{{ formatTimeSec(loadTime) }}</span>
      <span>•</span>
      <span class="mx-2">{{ formatTimeSec(lastRefreshTime) }}</span>
      <span>•</span>
      <span class="mx-2">{{ formatTimeSec(currentTime) }}</span>
    </div>
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
