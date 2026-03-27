import { and, eq } from "drizzle-orm";
import { createError, readBody } from "h3";
import { getRouterParam } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
import { publishFeedUpdate } from "~~/server/utils/feed-events";

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
      type: posts.type
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.authorId, user.id)))
    .limit(1);

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Příspěvek nebyl nalezen." });
  }

  const body = await readBody(event);
  const textContent = String(body?.textContent || "").trim();
  const maxLen = existing.type === "INSTAX" ? 50 : 200;

  if (textContent.length > maxLen) {
    throw createError({
      statusCode: 400,
      statusMessage: `Text je příliš dlouhý (max ${maxLen} znaků).`
    });
  }

  await db
    .update(posts)
    .set({
      textContent,
      updatedAt: Date.now()
    })
    .where(and(eq(posts.id, postId), eq(posts.authorId, user.id)));

  await publishFeedUpdate("updated", postId);
  return { ok: true };
});
