import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "~~/server/db/client";
import { postKdoHands, users } from "~~/server/db/schema";
import type { KdoParticipant } from "~~/shared/kdo";

type Db = ReturnType<typeof getDb>;

type KdoSummary = {
  participants: KdoParticipant[];
  viewerJoinedKdo: boolean;
};

const createEmptySummary = (): KdoSummary => ({
  participants: [],
  viewerJoinedKdo: false
});

export const getKdoSummaries = async (
  db: Db,
  viewerUserId: string,
  postIds: string[]
): Promise<Record<string, KdoSummary>> => {
  const uniquePostIds = Array.from(new Set(postIds.filter(Boolean)));
  const summaries = Object.fromEntries(
    uniquePostIds.map((postId) => [postId, createEmptySummary()])
  ) as Record<string, KdoSummary>;

  if (uniquePostIds.length === 0) {
    return summaries;
  }

  const rows = await db
    .select({
      postId: postKdoHands.postId,
      userId: users.id,
      shortName: users.shortName,
      createdAt: postKdoHands.createdAt
    })
    .from(postKdoHands)
    .innerJoin(users, eq(postKdoHands.userId, users.id))
    .where(inArray(postKdoHands.postId, uniquePostIds))
    .orderBy(asc(postKdoHands.createdAt));

  for (const row of rows) {
    const summary = summaries[row.postId];
    if (!summary) {
      continue;
    }

    summary.participants.push({
      userId: row.userId,
      shortName: row.shortName,
      createdAt: row.createdAt
    });

    if (row.userId === viewerUserId) {
      summary.viewerJoinedKdo = true;
    }
  }

  return summaries;
};

export const toggleKdoHand = async (
  db: Db,
  postId: string,
  userId: string
): Promise<boolean> => {
  const [existing] = await db
    .select({ postId: postKdoHands.postId })
    .from(postKdoHands)
    .where(and(eq(postKdoHands.postId, postId), eq(postKdoHands.userId, userId)))
    .limit(1);

  if (existing) {
    await db
      .delete(postKdoHands)
      .where(and(eq(postKdoHands.postId, postId), eq(postKdoHands.userId, userId)));
    return false;
  }

  await db.insert(postKdoHands).values({
    postId,
    userId,
    createdAt: Date.now()
  });
  return true;
};
