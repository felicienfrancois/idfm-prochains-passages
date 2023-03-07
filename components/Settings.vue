<template>
  <transition
    enter-from-class="translate-x-16 opacity-0"
    leave-to-class="translate-x-16 opacity-0"
    enter-active-class="transition duration-300"
    leave-active-class="transition duration-300"
  >
    <button
      v-show="!dialog && !idle"
      class="z-10 drop-shadow-xl fixed top-3 right-3 px-2 py-2 font-semibold text-sm bg-green-300 text-stone-900 rounded-full shadow-sm hover:opacity-60"
      @click="dialog = true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-10 h-10"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
      </svg>
    </button>
  </transition>
  <transition
    enter-from-class="-translate-y-full opacity-0 scale-y-50"
    leave-to-class="-translate-y-full opacity-0 scale-y-50"
    enter-active-class="transition duration-300"
    leave-active-class="transition duration-300"
  >
    <div v-show="dialog" class="transition duration-300 fixed z-20 bg-white top-0 left-0 w-screen h-screen flex flex-col">
      <div class="flex px-2 bg-stone-300 drop-shadow-md">
        <span class="grow" />
        <input
          v-model="search"
          type="text"
          class="w-full max-w-md border border-stone-200 focus:border-stone-600 focus-visible:outline-none my-1 mx-2 h-12 py-2 px-3"
          placeholder="Rechercher un arrêt de Bus, Métro, RER ou Transilien"
        >
        <span class="grow" />
        <button v-show="stops.length" class="rounded-full px-2 py-2 hover:opacity-60" @click="dialog = false">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-8 h-8"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="grow flex justify-center overflow-auto">
        <div v-if="!items.length" flat class="pt-6">
          <div class="animate-bounce flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-8 h-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </div>
          <div class="text-center text-stone-600">
            Recherchez vos arrêts de Bus, Métro, Tram, Rer d'île de
            France,<br>
            pour les ajouter à votre tableau de suivi des prochains
            passages.
          </div>
        </div>
        <div class="absolute z-20 top-14 bottom-0 left-0 right-0 flex items-center justify-center bg-stone-200/90" v-show="loading">
          <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-stone-800 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_2s_linear_infinite]">
          </div>
        </div>
        <div v-show="items.length" class="mt-3">
          <table class="w-screen">
            <tr
              v-for="item in items"
              :key="item.id"
              :class="{
                'cursor-pointer hover:bg-stone-50': true,
                'opacity-10': item._score && item._score > 3,
                'opacity-30': item._score === 3,
                'opacity-50': item._score === 2
              }"
              @click="toggleStop(item.id)"
            >
              <td
                :class="{
                  'px-3 py-2': true,
                  'opacity-10 text-stone-400': stops.indexOf(item.id) === -1
                }"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </td>
              <td class="text-right px-3 py-2">
                <LineChip v-for="line in item.lines" :key="line" :line="line" />
              </td>
              <td class="px-3 py-2 w-[50vw]">
                <div class="text-lg">
                  {{ item.name }}
                </div>
                <div class="text-sm text-stone-500">
                  {{ item.city }}
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div class="bg-white mb-5 px-2 py-2">
        <button
          class="w-full px-2 py-2 font-semibold text-sm bg-green-100 text-stone-700 shadow-sm hover:opacity-60 h-12 uppercase text-xl drop-shadow disabled:opacity-40"
          :disabled="stops.length == 0"
          @click="dialog = false"
        >
          Valider
        </button>
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">
const idle = useIdle();

const search = ref("");
const loading = ref(false);
const items = ref([] as Stop[]);
const stops = ref(useRoute().params.stopIds ? (useRoute().params.stopIds as string).split(",") : []);
const dialog = ref(!stops.value.length);

watch(search, () => debounce(autocomplete));

async function autocomplete () {
  if (search.value.length > 2) {
    loading.value = true;
    items.value = await $fetch(
      `/api/stops/search?${new URLSearchParams({ search: search.value })}`
    );
    loading.value = false;
  } else {
    items.value = [];
  }
}
function toggleStop (stopId: string) {
  const i = stops.value.indexOf(stopId);
  if (i !== -1) {
    stops.value.splice(i, 1);
  } else {
    stops.value.push(stopId);
  }
  useRouter().replace("/" + stops.value.join(","));
}
</script>
