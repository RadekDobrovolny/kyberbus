import { desc, eq } from "drizzle-orm";
import { createError, getRouterParam } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts, users } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireUser(event);
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
      textContent: posts.textContent,
      imagePath: posts.imagePath,
      createdAt: posts.createdAt
    })
    .from(posts)
    .where(eq(posts.authorId, id))
    .orderBy(desc(posts.createdAt))
    .limit(30);

  return { profile, posts: authoredPosts };
});
