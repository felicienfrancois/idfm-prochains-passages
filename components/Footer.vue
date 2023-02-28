<template>
  <v-slide-y-reverse-transition>
    <div
      class="text-caption text-white d-flex bg-grey pa-1"
      style="height: 26px; position: fixed; bottom: 0; width: 100%;"
    >
      <span class="mx-2">© {{ currentTime.getFullYear() }}
        <span class="hidden-sm-and-down">Félicien François</span></span>
      •
      <span class="mx-2"><a
        href="https://github.com/felicienfrancois/idfm-prochains-passages"
        class="text-white"
      ><span class="hidden-sm-and-down">Code </span>source</a></span>
      •
      <span class="mx-2">
        <span class="hidden-sm-and-down">Données fournies par l'</span><a
          href="https://prim.iledefrance-mobilites.fr"
          class="text-white"
        >
          API Ile de France Mobilité
        </a></span>
      <v-spacer />
      <span class="mx-2 hidden-xs">{{ $vuetify.display.width }}x{{ $vuetify.display.height }}</span>
      •
      <span class="mx-2 hidden-xs">{{ formatTimeSec(loadTime) }}</span>
      •
      <span class="mx-2 hidden-xs">{{ formatTimeSec(lastRefreshTime) }}</span>
      •
      <span class="mx-2 hidden-xs">{{ formatTimeSec(currentTime) }}</span>
    </div>
  </v-slide-y-reverse-transition>
</template>
<script setup lang="ts">
import formatTimeSec from "@/utils/formatTimeSec";

const loadTime = new Date();
const currentTime = useCurrentTime();
const lastRefreshTime = useLastRefreshTime();

</script>
