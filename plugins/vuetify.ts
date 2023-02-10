import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";

export default defineNuxtPlugin(nuxtApp => {
    const vuetify = createVuetify({
      ssr: true,
    });

  nuxtApp.vueApp.use(vuetify);
})