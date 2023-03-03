<template>
  <table class="scale-to-screen text-stone-700 w-full w-max-full -mt-1 mb-3">
    <template
      v-for="(stop, index) in next_departures"
      :key="stop.id"
    >
      <thead>
        <tr class="text-2xl text-white bg-stone-100">
          <th colspan="5" class="py-0.5 px-0">
            <div v-if="!index || stop.name !== next_departures[index-1].name" class="bg-stone-600">
              <span class="inline-block mr-4 my-1.5">{{ stop.name }}</span>
              <LineChip v-for="line in stop.lines" :key="line" :line="line" />
            </div>
            <div v-else class="bg-stone-600 h-1" />
          </th>
        </tr>
      </thead>
      <tbody class="shadow">
        <tr v-if="!stop.next_departures?.length">
          <td class="text-xl text-stone-500 pl-10 py-5" colspan="5">
            Ne circule pas
          </td>
        </tr>
        <transition
          v-for="(next_departure, i) in stop.next_departures"
          :key="next_departure.item_id"
          enter-from-class="scale-y-0 -mt-20 opacity-0"
          leave-to-class="scale-y-0 -mt-20 opacity-0"
          enter-active-class="transition duration-300"
          leave-active-class="transition duration-300"
        >
          <tr
            v-show="isFuture(next_departure.expected_departure_time || next_departure.aimed_departure_time)"
            :class="{ 'bg-stone-100': i % 2 == 0 }"
          >
            <td class="text-center py-1 px-2">
              <div
                v-if="!next_departure.departure_status && next_departure.aimed_departure_time"
                class="line-through text-stone-400 text-sm -my-1"
              >
                {{ formatTime(next_departure.aimed_departure_time) }}
              </div>
              <div
                :class="{
                  'text-lg': true,
                  'text-amber-500 -mb-1': !next_departure.departure_status,
                  'text-red-700 line-through': next_departure.departure_status === 'cancelled',
                }"
              >
                {{ formatTime(next_departure.expected_departure_time || next_departure.aimed_departure_time) }}
              </div>
            </td>
            <td v-if="next_departure.arrival_platform_name" class="py-1 pl-1 pr-4">
              <PlatformTag :platform_name="next_departure.arrival_platform_name" />
            </td>
            <td class="py-1 px-0">
              <LineChip :line="next_departure.line" />
            </td>
            <td class="py-1 px-1" :colspan="next_departure.arrival_platform_name ? 1 : 2">
              <div
                v-if="next_departure.journey_note"
                :class="{
                  'text-2xl': true,
                  'text-red-700': next_departure.departure_status === 'cancelled',
                }"
              >
                {{ next_departure.journey_note }}
              </div>
              <div
                :class="{
                  'overflow-hidden max-h-10 break-words': true,
                  'text-lg -mt-2 opacity-80': next_departure.journey_note,
                  'text-2xl my-0.5': !next_departure.journey_note,
                  'text-red-700': next_departure.departure_status === 'cancelled',
                }"
              >
                {{ next_departure.destination_display || next_departure.destination_name }}
              </div>
            </td>
            <td
              :class="{
                'text-center py-0.5 px-2 text-lg': true,
                'text-amber-500': !next_departure.departure_status,
                'text-red-700': next_departure.departure_status === 'cancelled',
              }"
            >
              <div v-if="next_departure.departure_status === 'cancelled'">
                Annulé
              </div>
              <div v-else-if="next_departure.vehicule_at_stop">
                A&nbsp;l'arrêt
              </div>
              <RemainingTime v-else :date="next_departure.expected_departure_time" />
            </td>
          </tr>
        </transition>
      </tbody>
      <tr v-if="index === next_departures.length -1 || stop.name !== next_departures[index + 1].name">
        <td class="h-1" colspan="5" />
      </tr>
    </template>
  </table>
</template>
<script setup lang="ts">
const next_departures = ref([] as Stop[]);
const stopIds = ref(useRoute().params.stopIds ? (useRoute().params.stopIds as string).split(",") : []);

function isFuture (date: string) {
  return new Date(date) >= useCurrentTime().value;
}

async function refresh () {
  next_departures.value = await $fetch(`/api/next_departures?stopIds=${stopIds.value.join(",")}`);
  useLastRefreshTime().value = new Date();
}

onMounted(() => setInterval(refresh, 60000));
onMounted(refresh);

</script>
