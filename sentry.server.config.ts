import * as Sentry from "@sentry/nuxt";
 
Sentry.init({
  dsn: "https://d446cc8e263a61ab2372370a98355b13@o4511360379322368.ingest.de.sentry.io/4511360384434256",

  // Enable sending of user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nuxt/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
