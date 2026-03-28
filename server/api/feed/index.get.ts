import { desc, eq, lt } from "drizzle-orm";
import { getQuery } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts, users } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
import { getReactionSummaries } from "~~/server/utils/reactions";
import { paginationSchema } from "~~/server/utils/validation";
import { createEmptyReactionCounts, createEmptyViewerReactions } from "~~/shared/reactions";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  ensureSchema();
  const db = getDb();
  const query = getQuery(event);
  const parsed = paginationSchema.safeParse(query);

  if (!parsed.success) {
    return { items: [], nextCursor: null };
  }

  const { cursor, limit } = parsed.data;
  const cursorTs = cursor ? Number.parseInt(cursor, 10) : null;

  const whereClause =
    cursorTs && Number.isFinite(cursorTs) ? lt(posts.createdAt, cursorTs) : undefined;

  const rows = await db
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
    .where(whereClause)
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const reactionSummaries = await getReactionSummaries(
    db,
    user.id,
    items.map((item) => item.id)
  );
  const last = items[items.length - 1];

  return {
    items: items.map((item) => {
      const summary = reactionSummaries[item.id];
      return {
        ...item,
        reactions: summary?.reactions || createEmptyReactionCounts(),
        viewerReactions: summary?.viewerReactions || createEmptyViewerReactions()
      };
    }),
    nextCursor: hasMore && last ? String(last.createdAt) : null
  };
});
