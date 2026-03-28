import { and, eq } from "drizzle-orm";
import { createError, getRouterParam, readBody } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { postReactions, posts } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
import { publishFeedUpdate } from "~~/server/utils/feed-events";
import { getReactionSummaries } from "~~/server/utils/reactions";
import {
  createEmptyReactionCounts,
  createEmptyViewerReactions,
  isReactionType
} from "~~/shared/reactions";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  ensureSchema();
  const db = getDb();
  const postId = getRouterParam(event, "id");

  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: "Chybí ID příspěvku." });
  }

  const [existingPost] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!existingPost) {
    throw createError({ statusCode: 404, statusMessage: "Příspěvek nebyl nalezen." });
  }

  const body = await readBody(event);
  const reactionTypeRaw = String(body?.reactionType || body?.reaction || "").toUpperCase();

  if (!isReactionType(reactionTypeRaw)) {
    throw createError({ statusCode: 400, statusMessage: "Neplatný typ reakce." });
  }

  const [existingReaction] = await db
    .select({
      postId: postReactions.postId
    })
    .from(postReactions)
    .where(
      and(
        eq(postReactions.postId, postId),
        eq(postReactions.userId, user.id),
        eq(postReactions.reactionType, reactionTypeRaw)
      )
    )
    .limit(1);

  if (existingReaction) {
    await db
      .delete(postReactions)
      .where(
        and(
          eq(postReactions.postId, postId),
          eq(postReactions.userId, user.id),
          eq(postReactions.reactionType, reactionTypeRaw)
        )
      );
  } else {
    await db.insert(postReactions).values({
      postId,
      userId: user.id,
      reactionType: reactionTypeRaw,
      createdAt: Date.now()
    });
  }

  const summaries = await getReactionSummaries(db, user.id, [postId]);
  const summary = summaries[postId];

  publishFeedUpdate("updated", postId);

  return {
    ok: true,
    postId,
    reactions: summary?.reactions || createEmptyReactionCounts(),
    viewerReactions: summary?.viewerReactions || createEmptyViewerReactions()
  };
});
