import { defineNitroPlugin } from "nitropack/runtime";
import { ensureSchema } from "~~/server/db/client";

export default defineNitroPlugin(() => {
  ensureSchema();
});
