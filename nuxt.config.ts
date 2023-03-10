export default defineNuxtConfig({
  css: ["@/assets/base.scss", "@/assets/lines.scss"],
  runtimeConfig: {
    // idfm api key. Should be set through environment variable NUXT_API_KEY
    primApiKey: "",
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "https://prochains-passages.fr",
    },
  },
  modules: [
    "@kevinmarrec/nuxt-pwa",
    "@nuxtjs/tailwindcss",
    "nuxt-simple-sitemap",
  ],
  app: {
    head: {
      title: "Prochains passages - Ile de France",
      meta: [
        {
          name: "description",
          content: "Composez votre écran de suivi des prochains passages de votre Bus, Métro, Tram, Rer d'île de France",
        }
      ],
      link: [
        {
          rel: "shortcut icon",
          type: "image/png",
          href: "/icon.png",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Tauri&display=swap",
        },
      ],
    },
  },
  pwa: {
    manifest: {
      name: "Prochains passages - Ile de France",
      short_name: "Prochains passages",
      lang: "fr",
    },
  },
});
