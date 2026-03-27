import { and, eq } from "drizzle-orm";
import { createError, getRouterParam } from "h3";
import { existsSync, unlinkSync } from "node:fs";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
import { getAbsoluteUploadPath } from "~~/server/utils/uploads";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  ensureSchema();
  const db = getDb();
  const postId = getRouterParam(event, "id");

  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: "Chybí ID příspěvku." });
  }

  const [existing] = await db
    .select({
      id: posts.id,
      imagePath: posts.imagePath
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.authorId, user.id)))
    .limit(1);

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Příspěvek nebyl nalezen." });
  }

  await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.authorId, user.id)));

  if (existing.imagePath) {
    const path = getAbsoluteUploadPath(existing.imagePath);
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }

  return { ok: true };
});
