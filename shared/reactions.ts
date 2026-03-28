export const REACTION_TYPES = ["HEART", "LAUGH", "ROCKET"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTION_TYPE_TO_KEY = {
  HEART: "heart",
  LAUGH: "laugh",
  ROCKET: "rocket"
} as const;

export type ReactionKey = (typeof REACTION_TYPE_TO_KEY)[ReactionType];

export type ReactionCounts = Record<ReactionKey, number>;
export type ViewerReactions = Record<ReactionKey, boolean>;

export const createEmptyReactionCounts = (): ReactionCounts => ({
  heart: 0,
  laugh: 0,
  rocket: 0
});

export const createEmptyViewerReactions = (): ViewerReactions => ({
  heart: false,
  laugh: false,
  rocket: false
});

export const isReactionType = (value: unknown): value is ReactionType =>
  typeof value === "string" && REACTION_TYPES.includes(value as ReactionType);
