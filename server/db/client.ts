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
      short_name TEXT NOT NULL,
      bio TEXT NOT NULL,
      contact TEXT NOT NULL,
      profile_photo_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

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
      text_content TEXT NOT NULL,
      image_path TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.run(sql`CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at);`);
  db.run(sql`CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);`);
};
