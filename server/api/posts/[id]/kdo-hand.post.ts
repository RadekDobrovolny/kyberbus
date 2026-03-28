import { eq } from "drizzle-orm";
import { createError, getRouterParam } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
import { publishFeedUpdate } from "~~/server/utils/feed-events";
import { getKdoSummaries, toggleKdoHand } from "~~/server/utils/kdo";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  ensureSchema();
  const db = getDb();
  const postId = getRouterParam(event, "id");

  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: "Chybí ID příspěvku." });
  }

  const [post] = await db
    .select({
      id: posts.id,
      type: posts.type
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: "Příspěvek nebyl nalezen." });
  }

  if (post.type !== "KDO") {
    throw createError({ statusCode: 400, statusMessage: "Zvednutou ruku lze použít jen u příspěvku Otázka." });
  }

  await toggleKdoHand(db, postId, user.id);
  const summaries = await getKdoSummaries(db, user.id, [postId]);
  const summary = summaries[postId];

  publishFeedUpdate("updated", postId);

  return {
    ok: true,
    participants: summary?.participants || [],
    viewerJoinedKdo: Boolean(summary?.viewerJoinedKdo)
  };
});
