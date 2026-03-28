import { desc, eq } from "drizzle-orm";
import { createError, getRouterParam } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts, users } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
import { getKdoSummaries } from "~~/server/utils/kdo";
import { getReactionSummaries } from "~~/server/utils/reactions";
import { createEmptyReactionCounts, createEmptyViewerReactions } from "~~/shared/reactions";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  ensureSchema();
  const db = getDb();
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Chybí ID profilu." });
  }

  const [profile] = await db
    .select({
      id: users.id,
      role: users.role,
      shortName: users.shortName,
      bio: users.bio,
      contact: users.contact,
      profilePhotoPath: users.profilePhotoPath,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: "Profil nebyl nalezen." });
  }

  const authoredPosts = await db
    .select({
      id: posts.id,
      type: posts.type,
      noticeLevel: posts.noticeLevel,
      textContent: posts.textContent,
      imagePath: posts.imagePath,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt
    })
    .from(posts)
    .where(eq(posts.authorId, id))
    .orderBy(desc(posts.createdAt))
    .limit(30);

  const reactionSummaries = await getReactionSummaries(
    db,
    user.id,
    authoredPosts.map((post) => post.id)
  );
  const kdoSummaries = await getKdoSummaries(
    db,
    user.id,
    authoredPosts.map((post) => post.id)
  );

  return {
    profile,
    posts: authoredPosts.map((post) => {
      const summary = reactionSummaries[post.id];
      const kdoSummary = kdoSummaries[post.id];
      return {
        ...post,
        reactions: summary?.reactions || createEmptyReactionCounts(),
        viewerReactions: summary?.viewerReactions || createEmptyViewerReactions(),
        kdoParticipants: kdoSummary?.participants || [],
        viewerJoinedKdo: Boolean(kdoSummary?.viewerJoinedKdo)
      };
    })
  };
});
