import { eq } from "drizzle-orm";
import { createError, getRouterParam } from "h3";
import { existsSync, unlinkSync } from "node:fs";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts } from "~~/server/db/schema";
import { isAdmin, requireUser } from "~~/server/utils/auth";
import { publishFeedUpdate } from "~~/server/utils/feed-events";
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
      authorId: posts.authorId,
      imagePath: posts.imagePath
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Příspěvek nebyl nalezen." });
  }

  if (!isAdmin(user) && existing.authorId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: "Tento příspěvek nemůžeš smazat." });
  }

  await db.delete(posts).where(eq(posts.id, postId));

  if (existing.imagePath) {
    const path = getAbsoluteUploadPath(existing.imagePath);
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }

  publishFeedUpdate("deleted", postId);
  return { ok: true };
});
