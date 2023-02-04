<template>
  <v-app>
    <v-app-bar density="compact" app>
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
          <Icon name="mdi:plus" size="2em" />
        </v-btn>
       </template>
       <v-card>
        <v-toolbar>
          <v-spacer />
          <v-text-field v-model="search" label="Rechercher un arrêt de Bus, Métro, RER ou Transilien" hide-details />
          <v-spacer />
          <v-btn
            icon
            dark
            @click="dialog = false"
            small
          >
            <Icon name="mdi:close" size="2em" />
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <v-list>
            <v-list-item v-for="item in items" :key="item.stop_id" @click="toggleStop(item.stop_id)" dense :title="item.stop_name" :subtitle="item.city">
              <template v-slot:prepend>
                <div style="min-width: 50px" class="text-center">
                  <Icon name="mdi:check" size="1.5em" v-if="stops.indexOf(item.stop_id) !== -1" />
                </div>
                <div style="width: 200px" class="text-right mr-3">
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
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
       </v-card>
      </v-dialog>
    </v-app-bar>
    <v-main app>
      <v-container>
        <v-row v-for="prochain_passage in prochains_passages" :key="prochain_passage">
          <v-col cols="1" class="text-right">
            <v-chip
              variant="elevated"
              size="small"
              label
              :class="resolveLineClass(prochain_passage.line)"
            >
              {{ prochain_passage.line }}
            </v-chip>
          </v-col>
          <v-col>
            {{ prochain_passage.destination_display || prochain_passage.destination_name }}
          </v-col>
          <v-col>
            {{ formatTime(prochain_passage.expected_departure_time) }}
          </v-col>
        </v-row>
      </v-container>
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