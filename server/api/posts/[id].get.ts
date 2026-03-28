import { eq } from "drizzle-orm";
import { createError, getRouterParam } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts, users } from "~~/server/db/schema";
import { isAdmin, requireUser } from "~~/server/utils/auth";
import { getReactionSummaries } from "~~/server/utils/reactions";
import { createEmptyReactionCounts, createEmptyViewerReactions } from "~~/shared/reactions";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  ensureSchema();
  const db = getDb();
  const postId = getRouterParam(event, "id");

  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: "Chybí ID příspěvku." });
  }

  const [post] = await db
    .select({
      id: posts.id,
      type: posts.type,
      noticeLevel: posts.noticeLevel,
      textContent: posts.textContent,
      imagePath: posts.imagePath,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: users.id,
      authorShortName: users.shortName,
      authorPhotoPath: users.profilePhotoPath
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: "Příspěvek nebyl nalezen." });
  }

  if (!isAdmin(authUser) && post.authorId !== authUser.id) {
    throw createError({ statusCode: 403, statusMessage: "Tento příspěvek nemůžeš upravit." });
  }

  const reactionSummaries = await getReactionSummaries(db, authUser.id, [post.id]);
  const summary = reactionSummaries[post.id];

  return {
    post: {
      ...post,
      reactions: summary?.reactions || createEmptyReactionCounts(),
      viewerReactions: summary?.viewerReactions || createEmptyViewerReactions()
    }
  };
});
