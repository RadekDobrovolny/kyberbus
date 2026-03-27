import { createReadStream, existsSync } from "node:fs";
import { extname } from "node:path";
import { createError, getRouterParam, sendStream, setHeader } from "h3";
import { getAbsoluteUploadPath } from "~~/server/utils/uploads";

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png"
};

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, "path");
  if (!pathParam) {
    throw createError({ statusCode: 404, statusMessage: "Soubor nebyl nalezen." });
  }

  if (pathParam.includes("..")) {
    throw createError({ statusCode: 400, statusMessage: "Neplatná cesta souboru." });
  }

  const absolutePath = getAbsoluteUploadPath(pathParam);
  if (!existsSync(absolutePath)) {
    throw createError({ statusCode: 404, statusMessage: "Soubor nebyl nalezen." });
  }

  const ext = extname(absolutePath).toLowerCase();
  setHeader(event, "content-type", MIME_BY_EXT[ext] || "application/octet-stream");
  setHeader(event, "cache-control", "public, max-age=86400");

  return sendStream(event, createReadStream(absolutePath));
});
