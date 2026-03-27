import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~~/assets/css/tailwind.css"],
  app: {
    head: {
      viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    }
  },
  runtimeConfig: {
    sessionCookieName: "kyberbus_session",
    sessionMaxAgeSeconds: 60 * 60 * 24 * 7,
    sessionCookieSecure: process.env.SESSION_COOKIE_SECURE || "auto",
    sqlitePath: process.env.SQLITE_PATH || "./data/kyberbus.sqlite",
    uploadsDir: process.env.UPLOADS_DIR || "./uploads",
    public: {
      appName: "Kyberbus"
    }
  },
  nitro: {
    routeRules: {
      "/api/**": { cors: false }
    }
  },
  typescript: {
    strict: true
  }
});
