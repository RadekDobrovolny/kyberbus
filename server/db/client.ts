import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle>;

declare global {
  // eslint-disable-next-line no-var
  var __kyberbusDb: DB | undefined;
}

const ensureParentDir = (filePath: string) => {
  mkdirSync(dirname(filePath), { recursive: true });
};

const require = createRequire(resolve(process.cwd(), "package.json"));
const BetterSqlite3 = require("better-sqlite3") as any;

const getSqliteFilePath = () => {
  const runtime = useRuntimeConfig();
  return resolve(process.cwd(), runtime.sqlitePath);
};

const isDuplicateColumnError = (error: unknown, columnName: string): boolean => {
  const visited = new Set<unknown>();
  let current: unknown = error;

  while (current && !visited.has(current)) {
    visited.add(current);

    const message = current instanceof Error ? current.message : String(current);
    if (message.toLowerCase().includes(`duplicate column name: ${columnName.toLowerCase()}`)) {
      return true;
    }

    if (typeof current === "object" && current !== null && "cause" in current) {
      current = (current as { cause?: unknown }).cause;
      continue;
    }

    break;
  }

  return false;
};

export const getDb = () => {
  if (globalThis.__kyberbusDb) {
    return globalThis.__kyberbusDb;
  }

  const sqlitePath = getSqliteFilePath();
  ensureParentDir(sqlitePath);

  const sqlite = new BetterSqlite3(sqlitePath);
  sqlite.pragma("journal_mode = WAL");

  const db = drizzle(sqlite, { schema });
  globalThis.__kyberbusDb = db;
  return db;
};

export const ensureSchema = () => {
  const db = getDb();

  db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      short_name TEXT NOT NULL,
      bio TEXT NOT NULL,
      contact TEXT NOT NULL,
      profile_photo_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  try {
    db.run(sql`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER';`);
  } catch (error) {
    if (!isDuplicateColumnError(error, "role")) {
      throw error;
    }
  }
  db.run(sql`UPDATE users SET role = 'USER' WHERE role IS NULL OR role = '';`);
  db.run(sql`UPDATE users SET role = 'USER' WHERE role NOT IN ('USER', 'ADMIN');`);
  db.run(
    sql`UPDATE users
        SET role = 'ADMIN'
        WHERE id = (
          SELECT id FROM users ORDER BY created_at ASC LIMIT 1
        )
        AND NOT EXISTS (
          SELECT 1 FROM users WHERE role = 'ADMIN'
        );`
  );

  db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.run(sql`CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);`);
  db.run(sql`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);`);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY NOT NULL,
      author_id TEXT NOT NULL,
      type TEXT NOT NULL,
      notice_level TEXT NOT NULL DEFAULT 'INFO',
      text_content TEXT NOT NULL,
      image_path TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.run(sql`CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at);`);
  db.run(sql`CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);`);
  try {
    db.run(sql`ALTER TABLE posts ADD COLUMN notice_level TEXT NOT NULL DEFAULT 'INFO';`);
  } catch (error) {
    if (!isDuplicateColumnError(error, "notice_level")) {
      throw error;
    }
  }
  db.run(sql`UPDATE posts SET notice_level = 'INFO' WHERE notice_level IS NULL OR notice_level = '';`);
  db.run(sql`UPDATE posts SET notice_level = 'INFO' WHERE notice_level NOT IN ('INFO', 'IMPORTANT');`);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS post_reactions (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (post_id, user_id, reaction_type),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.run(sql`CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON post_reactions(post_id);`);
  db.run(sql`CREATE INDEX IF NOT EXISTS post_reactions_user_id_idx ON post_reactions(user_id);`);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS post_kdo_hands (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.run(sql`CREATE INDEX IF NOT EXISTS post_kdo_hands_post_id_idx ON post_kdo_hands(post_id);`);
  db.run(sql`CREATE INDEX IF NOT EXISTS post_kdo_hands_user_id_idx ON post_kdo_hands(user_id);`);
};
