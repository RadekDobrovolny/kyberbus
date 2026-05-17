import { existsSync, unlinkSync } from "node:fs";
import { getDb, ensureSchema } from "~~/server/db/client";
import { postKdoHands, postReactions, posts } from "~~/server/db/schema";
import { requireSuperadmin } from "~~/server/utils/auth";
import { publishFeedUpdate } from "~~/server/utils/feed-events";
import { getAbsoluteUploadPath } from "~~/server/utils/uploads";

export default defineEventHandler(async (event) => {
  await requireSuperadmin(event);
  ensureSchema();
  const db = getDb();

  const existingPosts = await db
    .select({
      id: posts.id,
      imagePath: posts.imagePath
    })
    .from(posts);

  await db.delete(postReactions);
  await db.delete(postKdoHands);
  await db.delete(posts);

  const imagePaths = existingPosts
    .map((post) => post.imagePath)
    .filter((path): path is string => Boolean(path));

  for (const relPath of imagePaths) {
    const absolute = getAbsoluteUploadPath(relPath);
    if (existsSync(absolute)) {
      unlinkSync(absolute);
    }
  }

  publishFeedUpdate("cleared", "all");

  return {
    ok: true,
    deletedCount: existingPosts.length
  };
});
