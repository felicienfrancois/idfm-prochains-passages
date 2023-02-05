import vuetify from "vite-plugin-vuetify";

export default defineNuxtConfig({
	css: [
		"vuetify/styles",
		"@/assets/base.scss",
		"@/assets/lines.scss"
	],
	build: {
		transpile: ["vuetify"],
	},
	runtimeConfig: {
		// idfm api key. Should be set through environment variable NUXT_API_KEY
		apiKey: '',	
	},
	vite: {
		ssr: {
			noExternal: ["vuetify"],
		},
	},
	modules: [
		"nuxt-icon",
		async (options, nuxt) => {
			// @ts-ignore
			nuxt.hooks.hook("vite:extendConfig", (config) => config.plugins.push(vuetify()));
		},
	],
	app: {
		head: {
			title: "Prochains passages - Ile de France",
			link: [
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Tauri:wght@500;700&display=swap",
				},
			],
		},
	},
});