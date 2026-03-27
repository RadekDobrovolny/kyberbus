import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.SQLITE_PATH || "./data/kyberbus.sqlite"
  },
  verbose: true,
  strict: true
});
