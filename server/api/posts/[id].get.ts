import { eq } from "drizzle-orm";
import { createError, getRouterParam } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts, users } from "~~/server/db/schema";
import { isAdmin, requireUser } from "~~/server/utils/auth";

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

  return { post };
});
