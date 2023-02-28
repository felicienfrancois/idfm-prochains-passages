<template>
  <v-dialog v-model="dialog" fullscreen transition="dialog-top-transition">
    <template #activator="{ props }">
      <v-slide-y-transition>
        <v-btn
          v-show="!idle"
          v-bind="props"
          color="secondary"
          size="large"
          position="fixed"
          class="mt-2 mr-4"
          icon
          style="z-index: 1; right: 0"
        >
          <v-icon size="x-large" icon="mdi-table-edit" />
        </v-btn>
      </v-slide-y-transition>
    </template>
    <v-card>
      <v-toolbar class="px-2">
        <v-spacer class="hidden-md-and-down" />
        <v-text-field
          v-model="search"
          label="Rechercher un arrêt de Bus, Métro, RER ou Transilien"
          hide-details
          style="min-width: 300px"
        />
        <v-spacer class="hidden-md-and-down" />
        <v-btn large variant="plain" @click="dialog = false">
          <v-icon size="x-large" icon="mdi-close" />
        </v-btn>
      </v-toolbar>
      <v-card-text style="max-height: calc(100vh - 116px); overflow-y: auto">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-card v-if="!items.length" flat class="py-2">
              <div class="text-center">
                <v-icon icon="mdi-chevron-up" color="grey" />
              </div>
              <div class="text-center text-grey">
                Recherchez vos arrêts de Bus, Métro, Tram, Rer d'île de
                France,<br>
                pour les ajouter à votre tableau de suivi des prochains
                passages.
              </div>
            </v-card>
            <v-card
              v-for="item in items"
              :key="item.stop_id"
              flat
              class="py-2"
              @click="toggleStop(item.stop_id)"
            >
              <v-row dense>
                <v-col class="text-center" cols="1">
                  <v-icon
                    v-if="stops.indexOf(item.stop_id) !== -1"
                    icon="mdi-check"
                  />
                </v-col>
                <v-col cols="3" class="text-right py-2">
                  <v-chip
                    v-for="line in item.lines"
                    :key="line"
                    variant="elevated"
                    size="small"
                    label
                    :class="`font-weight-bold mr-1 ${resolveLineClass(line)}`"
                  >
                    {{ line }}
                  </v-chip>
                </v-col>
                <v-col cols="8">
                  <v-list-item
                    :title="item.stop_name"
                    :subtitle="item.city"
                    class="py-0"
                  />
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="secondary"
          width="100%"
          size="x-large"
          class="font-weight-bold"
          :rounded="0"
          variant="tonal"
          @click="dialog = false"
        >
          Fermer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import debounce from "@/utils/debounce";
import resolveLineClass from "@/utils/resolveLineClass";

const idle = useIdle();

const search = ref("");
const items = ref([]);
const stops = ref(useRoute().params.stopIds ? (useRoute().params.stopIds as string).split(",") : []);
const dialog = ref(!stops.value.length);

watch(search, () => debounce(autocomplete));

async function autocomplete () {
  if (search && search.value.length > 2) {
    items.value = await $fetch(
      `/api/arrets?${new URLSearchParams({ search: search.value })}`
    );
  }
}
function toggleStop (stopId: string) {
  const i = stops.value.indexOf(stopId);
  if (i !== -1) {
    stops.value.splice(i, 1);
  } else {
    stops.value.push(stopId);
  }
  useRouter().replace(stops.value.join(","));
}
</script>
