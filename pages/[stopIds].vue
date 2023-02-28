<template>
  <div class="scale-to-screen">
    <v-card
      v-for="(stop, index) in next_departures"
      :key="stop.id"
      flat
    >
      <v-toolbar
        v-if="!index || stop.name !== next_departures[index-1].name"
        :class="{
          'px-3': true,
          'mt-1': index,
        }"
        density="compact"
        color="grey-lighten-2"
        :rounded="0"
        height="54"
      >
        <v-toolbar-title>
          <span class="mr-4">{{ stop.name }}</span>
          <v-chip
            v-for="line in stop.lines"
            :key="line"
            variant="elevated"
            size="small"
            label
            :class="`font-weight-bold mr-1 ${resolveLineClass(line)}`"
          >
            {{ line }}
          </v-chip>
        </v-toolbar-title>
      </v-toolbar>
      <div v-else class="bg-grey" style="height: 2px" />
      <v-container fluid class="pa-0">
        <v-row v-if="!stop.next_departures?.length">
          <v-col class="text-disabled pl-10 py-6 ">
            Ne circule pas
          </v-col>
        </v-row>
        <v-expand-transition
          v-for="(next_departure, index) in stop.next_departures"
          :key="next_departure.item_id"
        >
          <v-row
            v-show="
              isFuture(
                next_departure.expected_departure_time ||
                  next_departure.aimed_departure_time
              )
            "
            no-gutters
            :class="{
              'text-disabled':
                next_departure.departure_status === 'cancelled',
              'bg-grey-lighten-4': index % 2,
            }"
          >
            <v-col
              cols="2"
              class="font-weight-normal d-none d-sm-flex flex-column align-center justify-center"
            >
              <div
                v-if="
                  !next_departure.departure_status &&
                    next_departure.aimed_departure_time
                "
                class="text-decoration-line-through text-disabled mt-n1 mb-n2"
              >
                {{ formatTime(next_departure.aimed_departure_time) }}
              </div>
              <div
                :class="{
                  'text-h6': true,
                  'text-warning mb-n1': !next_departure.departure_status,
                  'text-error text-decoration-line-through':
                    next_departure.departure_status === 'cancelled',
                }"
              >
                {{
                  formatTime(
                    next_departure.expected_departure_time ||
                      next_departure.aimed_departure_time
                  )
                }}
              </div>
            </v-col>
            <v-col cols="9" sm="8">
              <v-list-item density="compact">
                <template #prepend>
                  <v-chip
                    variant="elevated"
                    size="small"
                    label
                    :class="`mr-4 ${resolveLineClass(next_departure.line)}`"
                  >
                    {{ next_departure.line }}
                  </v-chip>
                </template>
                <v-list-item-title
                  :class="{
                    'text-h6': true,
                    'text-error text-decoration-line-through': next_departure.departure_status === 'cancelled',
                  }"
                >
                  {{ next_departure.destination_display || next_departure.destination_name }}
                </v-list-item-title>
                <v-list-item-subtitle v-if="next_departure.journey_note">
                  {{ next_departure.journey_note }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col
              cols="3"
              sm="2"
              :class="{
                'text-h6 d-flex align-center justify-center': true,
                'text-warning': !next_departure.departure_status,
                'text-error': next_departure.departure_status === 'cancelled',
              }"
            >
              <span v-if="next_departure.departure_status === 'cancelled'">Annulé</span>
              <span v-else-if="next_departure.vehicule_at_stop">A l'arrêt</span>
              <span
                v-else
                v-html="formatRemainingTime(next_departure.expected_departure_time)"
              />
            </v-col>
          </v-row>
        </v-expand-transition>
      </v-container>
    </v-card>
  </div>
</template>
<script setup lang="ts">
const next_departures = ref([] as Stop[]);
const stopIds = ref(useRoute().params.stopIds ? (useRoute().params.stopIds as string).split(",") : []);

function isFuture (date: string) {
  return new Date(date) >= new Date();
}

function resolveLineClass (line: string) {
  return `mr-1 v-chip--label v-chip--density-default v-chip--size-small v-chip--variant-elevated font-weight-bold line--${line
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^A-Za-z0-9-]/g, "_")}`;
}

async function refresh () {
  next_departures.value = await $fetch(`/api/next_departures?stopIds=${stopIds.value.join(",")}`);
  useLastRefreshTime().value = new Date();
}

onMounted(() => setInterval(refresh, 60000));
onMounted(refresh);

</script>
