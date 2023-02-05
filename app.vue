<template>
  <v-app>
    <v-app-bar density="compact" app>
      <v-spacer />
      <v-dialog
        v-model="dialog"
        fullscreen
        transition="dialog-top-transition"
      >
       <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          small
        >
          <Icon name="mdi:cog-outline" size="2em" />
        </v-btn>
       </template>
       <v-card>
        <v-toolbar class="px-2">
          <v-spacer />
          <v-text-field v-model="search" label="Rechercher un arrêt de Bus, Métro, RER ou Transilien" hide-details style="min-width: 300px" />
          <v-spacer />
          <v-btn
            dark
            @click="dialog = false"
            :rounded="0"
          >
            <Icon name="mdi:close" size="2em" />
          </v-btn>
        </v-toolbar>
        <v-card-text style="max-height: calc(100vh - 116px); overflow-y: auto;">
          <v-card flat v-for="item in items" :key="item.stop_id" @click="toggleStop(item.stop_id)" class="py-2">
            <v-row dense>
              <v-col class="text-center" cols="1">
                  <Icon name="mdi:check" size="1.5em" v-if="stops.indexOf(item.stop_id) !== -1" />
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
                <v-list-item :title="item.stop_name" :subtitle="item.city" class="py-0" />
              </v-col>
            </v-row>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="secondary"
            @click="dialog = false"
            width="100%"
            size="x-large"
            class="font-weight-bold"
            :rounded="0"
            variant="tonal"
          >
            Fermer
          </v-btn>
        </v-card-actions>
       </v-card>
      </v-dialog>
    </v-app-bar>
    <v-main app>
      <v-card v-for="stop in prochains_passages" :key="stop.id" flat class="pt-5">
        <v-toolbar class="px-3" density="compact">
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
        <v-container fluid>
          <v-row v-if="!stop.next_stops.length">
            <v-col class="text-disabled">
              Aucun résultat
            </v-col>
          </v-row>
          <v-row v-for="prochain_passage in stop.next_stops" :key="prochain_passage" dense>
            <v-col>
              <v-list-item>
                <template v-slot:prepend>
                  <v-chip
                    variant="elevated"
                    size="small"
                    label
                    :class="`mr-4 ${resolveLineClass(prochain_passage.line)}`"
                  >
                    {{ prochain_passage.line }}
                  </v-chip>
                </template>
                <v-list-item-title class="text-h6">
                  {{ prochain_passage.destination_display || prochain_passage.destination_name }}
                </v-list-item-title>
                <v-list-item-subtitle v-if="prochain_passage.journey_note">
                  {{ prochain_passage.journey_note }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col class="text-h5">
              {{ formatTime(prochain_passage.expected_departure_time) }}
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-main>
  </v-app>
</template>
<script lang="ts">
import debounce from "@/utils/debounce";

export default defineNuxtComponent({
  fetchKey: 'prochains_passages',
  data() {
    return {
      select: [],
      search: "",
      items: [],
      loading: false,
      stops: [] as string[],
      dialog: false as boolean,
      prochains_passages: [],
    };
  },
  watch: {
    search() {
      debounce(this.autocomplete);
    },
  },
  methods: {
    resolveLineClass(line: string) {
      return `mr-1 v-chip--label v-chip--density-default v-chip--size-small v-chip--variant-elevated font-weight-bold line--${line.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9-]/g, '_')}`;
    },
    async autocomplete() {
      if (this.search && this.search.length > 2) {
        this.items = await $fetch(`/api/arrets?${new URLSearchParams({ search: this.search })}`);
      }
    },
    formatTime(date: string|number|Date) {
      return (new Date(date))
        .toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
        .split(" ").pop()
        ?.split(":").splice(0, 2).join(":");
    },
    toggleStop(stopId: string) {
      const i = this.stops.indexOf(stopId);
      if (i !== -1) this.stops.splice(i, 1);
      else this.stops.push(stopId);
      this.$router.push({
        query: { ...this.$route.query, stops: JSON.stringify(this.stops) }
      });
      this.refresh();
    },
    async refresh() {
      this.prochains_passages = this.stops.length ? await $fetch(`/api/prochains_passages?stops=${JSON.stringify(this.stops)}`) : [];
    },
  },
  mounted() {
    setInterval(this.refresh, 30000);
  },
  async asyncData (arg: any) {
    const stops = JSON.parse(arg._route.query.stops || "[]") || [];
    return {
      stops: stops,
      prochains_passages: stops.length ? await $fetch(`/api/prochains_passages?stops=${JSON.stringify(stops)}`) : [],
      dialog: !stops.length,
    };
  }
});
</script>