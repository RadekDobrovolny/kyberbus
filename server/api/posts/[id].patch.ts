import { eq } from "drizzle-orm";
import { createError, readBody } from "h3";
import { getRouterParam } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts } from "~~/server/db/schema";
import { isAdmin, requireUser } from "~~/server/utils/auth";
import { publishFeedUpdate } from "~~/server/utils/feed-events";
import { rotateStoredImage } from "~~/server/utils/uploads";
import { getPostMaxLength } from "~~/shared/content";

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
      type: posts.type,
      imagePath: posts.imagePath
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Příspěvek nebyl nalezen." });
  }

  if (!isAdmin(user) && existing.authorId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: "Tento příspěvek nemůžeš upravit." });
  }

  const body = await readBody(event);
  const textContent = String(body?.textContent || "").trim();
  const imageRotationStepsRaw = Number.parseInt(String(body?.imageRotationSteps ?? "0"), 10);
  const imageRotationSteps =
    Number.isFinite(imageRotationStepsRaw) && imageRotationStepsRaw >= 0
      ? imageRotationStepsRaw % 4
      : 0;
  const maxLen = getPostMaxLength(existing.type);

  if (textContent.length > maxLen) {
    throw createError({
      statusCode: 400,
      statusMessage: `Text je příliš dlouhý (max ${maxLen} znaků).`
    });
  }

  if (imageRotationSteps !== 0) {
    if (existing.type !== "INSTAX" || !existing.imagePath) {
      throw createError({
        statusCode: 400,
        statusMessage: "Rotaci lze použít jen u Instax příspěvku s fotkou."
      });
    }

    await rotateStoredImage(existing.imagePath, imageRotationSteps * 90);
  }

  await db
    .update(posts)
    .set({
      textContent,
      updatedAt: Date.now()
    })
    .where(eq(posts.id, postId));

  publishFeedUpdate("updated", postId);
  return { ok: true };
});
