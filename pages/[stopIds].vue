<template>
  <div class="scale-to-screen">
    <v-card
      v-for="(stop, index) in prochains_passages"
      :key="stop.id"
      flat
    >
      <v-toolbar
        v-if="!index || stop.name !== prochains_passages[index-1].name"
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
        <v-row v-if="!stop.next_stops.length">
          <v-col class="text-disabled pl-10 py-6 ">
            Ne circule pas
          </v-col>
        </v-row>
        <v-expand-transition
          v-for="(prochain_passage, index) in stop.next_stops"
          :key="prochain_passage"
        >
          <v-row
            v-show="
              isFuture(
                prochain_passage.expected_departure_time ||
                  prochain_passage.aimed_departure_time
              )
            "
            no-gutters
            :class="{
              'text-disabled':
                prochain_passage.departure_status === 'cancelled',
              'bg-grey-lighten-4': index % 2,
            }"
          >
            <v-col
              cols="2"
              class="font-weight-normal d-none d-sm-flex flex-column align-center justify-center"
            >
              <div
                v-if="
                  !prochain_passage.departure_status &&
                    prochain_passage.aimed_departure_time
                "
                class="text-decoration-line-through text-disabled mt-n1 mb-n2"
              >
                {{ formatTime(prochain_passage.aimed_departure_time) }}
              </div>
              <div
                :class="{
                  'text-h6': true,
                  'text-warning mb-n1': !prochain_passage.departure_status,
                  'text-error text-decoration-line-through':
                    prochain_passage.departure_status === 'cancelled',
                }"
              >
                {{
                  formatTime(
                    prochain_passage.expected_departure_time ||
                      prochain_passage.aimed_departure_time
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
                    :class="`mr-4 ${resolveLineClass(prochain_passage.line)}`"
                  >
                    {{ prochain_passage.line }}
                  </v-chip>
                </template>
                <v-list-item-title
                  :class="{
                    'text-h6': true,
                    'text-error text-decoration-line-through': prochain_passage.departure_status === 'cancelled',
                  }"
                >
                  {{ prochain_passage.destination_display || prochain_passage.destination_name }}
                </v-list-item-title>
                <v-list-item-subtitle v-if="prochain_passage.journey_note">
                  {{ prochain_passage.journey_note }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col
              cols="3"
              sm="2"
              :class="{
                'text-h6 d-flex align-center justify-center': true,
                'text-warning': !prochain_passage.departure_status,
                'text-error': prochain_passage.departure_status === 'cancelled',
              }"
            >
              <span v-if="prochain_passage.departure_status === 'cancelled'">Annulé</span>
              <span v-else-if="prochain_passage.vehicule_at_stop">A l'arrêt</span>
              <span
                v-else
                v-html="formatRemainingTime(prochain_passage.expected_departure_time)"
              />
            </v-col>
          </v-row>
        </v-expand-transition>
      </v-container>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import formatRemainingTime from "@/utils/formatRemainingTime";
import formatTime from "@/utils/formatTime";

const prochains_passages = ref([]);
const stops = ref(useRoute().params.stopIds ? (useRoute().params.stopIds as string).split(",") : []);

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
  prochains_passages.value = await $fetch(
    `/api/prochains_passages?stopIds=${stops.value.join(",")}`
  );
  useLastRefreshTime().value = new Date();
}

onMounted(() => setInterval(refresh, 60000));
onMounted(refresh);

</script>
