import { desc, eq, lt } from "drizzle-orm";
import { getQuery } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts, users } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
import { paginationSchema } from "~~/server/utils/validation";

export default defineEventHandler(async (event) => {
  await requireUser(event);
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
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? String(last.createdAt) : null
  };
});
