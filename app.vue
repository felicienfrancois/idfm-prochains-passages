<template>
  <Link rel="shortcut icon" type="image/png" href="/icon.png" />
  <v-app>
    <v-dialog
      v-model="dialog"
      fullscreen
      transition="dialog-top-transition"
    >
      <template v-slot:activator="{ props }">
        <v-slide-y-transition>
          <v-btn
            v-bind="props"
            color="secondary"
            size="large"
            position="fixed"
            class="mt-2 mr-4"
            icon
            style="z-index: 1; right: 0"
            v-show="!idle"
          >
            <v-icon size="x-large" icon="mdi-table-edit" />
          </v-btn>
        </v-slide-y-transition>
      </template>
      <v-card>
      <v-toolbar class="px-2">
        <v-spacer class="hidden-md-and-down" />
        <v-text-field v-model="search" label="Rechercher un arrêt de Bus, Métro, RER ou Transilien" hide-details style="min-width: 300px" />
        <v-spacer class="hidden-md-and-down" />
        <v-btn
          @click="dialog = false"
          large
          variant="plain"
        >
          <v-icon size="x-large" icon="mdi-close" />
        </v-btn>
      </v-toolbar>
      <v-card-text style="max-height: calc(100vh - 116px); overflow-y: auto;">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-card flat v-if="!items.length" class="py-2">
              <div class="text-center"><v-icon icon="mdi-chevron-up" color="grey" /></div>
              <div class="text-center text-grey">
                Recherchez vos arrêts de Bus, Métro, Tram, Rer d'île de France,<br />
                pour les ajouter à votre tableau de suivi des prochains passages.
              </div>
            </v-card>
            <v-card flat v-for="item in items" :key="item.stop_id" @click="toggleStop(item.stop_id)" class="py-2">
              <v-row dense>
                <v-col class="text-center" cols="1">
                    <v-icon icon="mdi-check" v-if="stops.indexOf(item.stop_id) !== -1" />
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
          </v-col>
        </v-row>
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
    <v-main app>
      <div class="scale-to-screen">
        <v-card v-for="stop in prochains_passages" :key="stop.id" flat class="pb-5">
          <v-toolbar class="px-3" density="compact" color="grey-lighten-2" :rounded="0" height="56">
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
          <v-container fluid class="pa-0">
            <v-row v-if="!stop.next_stops.length">
              <v-col class="text-disabled pl-10 pt-5">
                Ne circule pas
              </v-col>
            </v-row>
            <v-expand-transition v-for="(prochain_passage,index) in stop.next_stops" :key="prochain_passage">
              <v-row
                no-gutters
                :class="{
                  'text-disabled': prochain_passage.departure_status === 'cancelled',
                  'bg-grey-lighten-4': index % 2
                }"
                v-show="isFuture(prochain_passage.expected_departure_time || prochain_passage.aimed_departure_time)"
              >
                <v-col cols="2" class="font-weight-normal d-none d-sm-flex flex-column align-center justify-center">
                  <div v-if="!prochain_passage.departure_status && prochain_passage.aimed_departure_time" class="text-decoration-line-through text-disabled mt-n1 mb-n2">
                    {{ formatTime(prochain_passage.aimed_departure_time) }}
                  </div>
                  <div :class="{
                    'text-h6': true,
                    'text-warning mb-n1': !prochain_passage.departure_status,
                    'text-error text-decoration-line-through': prochain_passage.departure_status === 'cancelled'
                  }">
                    {{ formatTime(prochain_passage.expected_departure_time || prochain_passage.aimed_departure_time) }}
                  </div>
                </v-col>
                <v-col cols="9" sm="8">
                  <v-list-item density="compact">
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
                    <v-list-item-title :class="{
                      'text-h6': true,
                      'text-error text-decoration-line-through': prochain_passage.departure_status === 'cancelled'
                    }">
                      {{ prochain_passage.destination_display || prochain_passage.destination_name }}
                    </v-list-item-title>
                    <v-list-item-subtitle v-if="prochain_passage.journey_note">
                      {{ prochain_passage.journey_note }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-col>
                <v-col cols="3" sm="2" :class="{
                  'text-h6 d-flex align-center justify-center': true,
                  'text-warning': !prochain_passage.departure_status,
                  'text-error': prochain_passage.departure_status === 'cancelled'
                }">
                  <span v-if="prochain_passage.departure_status === 'cancelled'">Annulé</span>
                  <span v-else-if="prochain_passage.vehicule_at_stop">A l'arrêt</span>
                  <span v-else v-html="formatRemainingTime(prochain_passage.expected_departure_time)" />
                </v-col>
              </v-row>
            </v-expand-transition>
          </v-container>
        </v-card>
      </div>
    </v-main>
    <v-slide-y-reverse-transition>
      <v-footer color="grey" app class="text-caption" height="24px" v-show="!idle">
        <span class="mx-2">© {{ new Date().getFullYear() }} <span class="hidden-xs">Félicien François</span></span>
        •
        <span class="mx-2"><a href="https://github.com/felicienfrancois/idfm-prochains-passages" class="text-white"><span class="hidden-xs">Code </span>source</a></span>
        •
        <span class="mx-2"><span class="hidden-xs">Données fournies par l'</span><a href="https://prim.iledefrance-mobilites.fr" class="text-white">API Ile de France Mobilité</a></span>
      </v-footer>
    </v-slide-y-reverse-transition>
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
      currentTimestamp: new Date().getTime(),
      idleTimer: null as NodeJS.Timeout|null,
      idle: true,
    };
  },
  watch: {
    search() {
      debounce(this.autocomplete);
    },
  },
  methods: {
    isFuture(date: string) {
      return new Date(date) >= new Date();
    },
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
    formatRemainingTime(date: string|number|Date) {
      const remainingMin = Math.round((new Date(date).getTime() - this.currentTimestamp) / 60000);
      if (remainingMin > 1) {
        return `<span class="text-h5">${remainingMin}</span><span class="text-body-1">min</span>`;
      } else {
        return "A l'approche";
      }
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
    resetIdleTimer() {
      this.idle = false;
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.idle = true, 10000);
    }
  },
  mounted() {
    setInterval(this.refresh, 60000);
    setInterval(() => this.currentTimestamp = new Date().getTime(), 5000);

    window.onmousemove = this.resetIdleTimer.bind(this);
    window.onmousedown = this.resetIdleTimer.bind(this); 
    window.ontouchstart = this.resetIdleTimer.bind(this);
    window.ontouchmove = this.resetIdleTimer.bind(this);
    window.onclick = this.resetIdleTimer.bind(this);
    window.onkeydown = this.resetIdleTimer.bind(this);
    window.addEventListener("scroll", this.resetIdleTimer.bind(this), true);
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