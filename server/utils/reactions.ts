import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "~~/server/db/client";
import { postReactions } from "~~/server/db/schema";
import {
  REACTION_TYPE_TO_KEY,
  createEmptyReactionCounts,
  createEmptyViewerReactions
} from "~~/shared/reactions";

type Db = ReturnType<typeof getDb>;

type ReactionSummary = {
  reactions: ReturnType<typeof createEmptyReactionCounts>;
  viewerReactions: ReturnType<typeof createEmptyViewerReactions>;
};

const createEmptySummary = (): ReactionSummary => ({
  reactions: createEmptyReactionCounts(),
  viewerReactions: createEmptyViewerReactions()
});

export const getReactionSummaries = async (
  db: Db,
  viewerUserId: string,
  postIds: string[]
): Promise<Record<string, ReactionSummary>> => {
  const uniquePostIds = Array.from(new Set(postIds.filter(Boolean)));
  const summaries = Object.fromEntries(
    uniquePostIds.map((postId) => [postId, createEmptySummary()])
  ) as Record<string, ReactionSummary>;

  if (uniquePostIds.length === 0) {
    return summaries;
  }

  const counts = await db
    .select({
      postId: postReactions.postId,
      reactionType: postReactions.reactionType,
      count: sql<number>`count(*)`
    })
    .from(postReactions)
    .where(inArray(postReactions.postId, uniquePostIds))
    .groupBy(postReactions.postId, postReactions.reactionType);

  for (const row of counts) {
    const summary = summaries[row.postId];
    if (!summary) {
      continue;
    }
    const key = REACTION_TYPE_TO_KEY[row.reactionType];
    summary.reactions[key] = Number(row.count) || 0;
  }

  const viewerRows = await db
    .select({
      postId: postReactions.postId,
      reactionType: postReactions.reactionType
    })
    .from(postReactions)
    .where(
      and(
        eq(postReactions.userId, viewerUserId),
        inArray(postReactions.postId, uniquePostIds)
      )
    );

  for (const row of viewerRows) {
    const summary = summaries[row.postId];
    if (!summary) {
      continue;
    }
    const key = REACTION_TYPE_TO_KEY[row.reactionType];
    summary.viewerReactions[key] = true;
  }

  return summaries;
};
