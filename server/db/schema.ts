import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  login: text("login").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["USER", "ADMIN"] }).notNull().default("USER"),
  shortName: text("short_name").notNull(),
  bio: text("bio").notNull(),
  contact: text("contact").notNull(),
  profilePhotoPath: text("profile_photo_path").notNull(),
  createdAt: integer("created_at").notNull(),
  lastActiveAt: integer("last_active_at"),
  updatedAt: integer("updated_at").notNull()
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull()
  },
  (table) => ({
    tokenHashIdx: index("sessions_token_hash_idx").on(table.tokenHash),
    userIdIdx: index("sessions_user_id_idx").on(table.userId)
  })
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["INSTAX", "LEPIK", "DISPECINK", "KDO", "MESTO"] }).notNull(),
    noticeLevel: text("notice_level", { enum: ["INFO", "IMPORTANT"] }).notNull().default("INFO"),
    textContent: text("text_content").notNull(),
    imagePath: text("image_path"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull()
  },
  (table) => ({
    createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
    authorIdIdx: index("posts_author_id_idx").on(table.authorId)
  })
);

export const postKdoHands = sqliteTable(
  "post_kdo_hands",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.userId] }),
    postIdIdx: index("post_kdo_hands_post_id_idx").on(table.postId),
    userIdIdx: index("post_kdo_hands_user_id_idx").on(table.userId)
  })
);

export const postReactions = sqliteTable(
  "post_reactions",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type", { enum: ["HEART", "LAUGH", "ROCKET"] }).notNull(),
    createdAt: integer("created_at").notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.userId, table.reactionType] }),
    postIdIdx: index("post_reactions_post_id_idx").on(table.postId),
    userIdIdx: index("post_reactions_user_id_idx").on(table.userId)
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostReaction = typeof postReactions.$inferSelect;
export type PostKdoHand = typeof postKdoHands.$inferSelect;
