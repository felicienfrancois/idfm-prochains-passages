export default defineNuxtConfig({
  css: ["@/assets/base.scss", "@/assets/lines.scss"],
  runtimeConfig: {
    // idfm api key. Should be set through environment variable NUXT_API_KEY
    primApiKey: "",
  },
  modules: [
    "@kevinmarrec/nuxt-pwa",
    "@nuxtjs/tailwindcss"
  ],
  app: {
    head: {
      title: "Prochains passages - Ile de France",
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Tauri&display=swap",
        }
      ],
    },
  },
});
