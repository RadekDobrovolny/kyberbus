import { eq } from "drizzle-orm";
import { createError, getRouterParam } from "h3";
import { existsSync, unlinkSync } from "node:fs";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts, users } from "~~/server/db/schema";
import { requireAdmin } from "~~/server/utils/auth";
import { publishFeedUpdate } from "~~/server/utils/feed-events";
import { getAbsoluteUploadPath } from "~~/server/utils/uploads";

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  ensureSchema();
  const db = getDb();
  const userId = getRouterParam(event, "id");

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "Chybí ID profilu." });
  }

  if (userId === admin.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Admin si nemůže smazat vlastní profil."
    });
  }

  const [profile] = await db
    .select({ id: users.id, profilePhotoPath: users.profilePhotoPath })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: "Profil nebyl nalezen." });
  }

  const authoredImages = await db
    .select({ imagePath: posts.imagePath })
    .from(posts)
    .where(eq(posts.authorId, userId));

  await db.delete(users).where(eq(users.id, userId));

  const allPaths = [
    profile.profilePhotoPath,
    ...authoredImages.map((item) => item.imagePath).filter((path): path is string => Boolean(path))
  ];

  for (const relPath of allPaths) {
    const absolute = getAbsoluteUploadPath(relPath);
    if (existsSync(absolute)) {
      unlinkSync(absolute);
    }
  }

  publishFeedUpdate("deleted", userId);

  return { ok: true };
});
