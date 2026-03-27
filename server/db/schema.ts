import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  login: text("login").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  shortName: text("short_name").notNull(),
  bio: text("bio").notNull(),
  contact: text("contact").notNull(),
  profilePhotoPath: text("profile_photo_path").notNull(),
  createdAt: integer("created_at").notNull(),
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
    type: text("type", { enum: ["INSTAX", "LEPIK"] }).notNull(),
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Post = typeof posts.$inferSelect;
