import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

const readLocalEnv = () => {
  const envPath = resolve(root, ".env");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional
  }
};

const ensureDbSchema = (db) => {
  db.exec(`
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);`);
  db.exec(`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);`);

  db.exec(`
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
  db.exec(`CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at);`);
  db.exec(`CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);`);
};

const buildColor = (index) => {
  const palette = [
    { r: 239, g: 68, b: 68 },
    { r: 59, g: 130, b: 246 },
    { r: 34, g: 197, b: 94 },
    { r: 245, g: 158, b: 11 },
    { r: 168, g: 85, b: 247 }
  ];
  return palette[index % palette.length];
};

const createImage = async (absolutePath, width, height, color) => {
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color
    }
  })
    .webp({ quality: 82 })
    .toFile(absolutePath);
};

const run = async () => {
  readLocalEnv();

  const sqlitePath = resolve(root, process.env.SQLITE_PATH || "./data/kyberbus.sqlite");
  const uploadsDir = resolve(root, process.env.UPLOADS_DIR || "./uploads");
  const profilesDir = join(uploadsDir, "profiles");
  const instaxDir = join(uploadsDir, "instax");

  mkdirSync(dirname(sqlitePath), { recursive: true });
  mkdirSync(profilesDir, { recursive: true });
  mkdirSync(instaxDir, { recursive: true });

  const db = new Database(sqlitePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  ensureDbSchema(db);

  const seedLogins = ["user1", "user2", "user3", "user4", "user5"];
  const seedUserRows = db
    .prepare(`SELECT id, login, profile_photo_path FROM users WHERE login IN (${seedLogins.map(() => "?").join(",")})`)
    .all(...seedLogins);

  const seedUserIds = seedUserRows.map((row) => row.id);
  const seedInstaxRows = seedUserIds.length
    ? db
        .prepare(
          `SELECT image_path FROM posts WHERE author_id IN (${seedUserIds.map(() => "?").join(",")}) AND image_path IS NOT NULL`
        )
        .all(...seedUserIds)
    : [];

  db.prepare("DELETE FROM users WHERE login IN (?, ?, ?, ?, ?)").run(...seedLogins);

  for (const row of [...seedUserRows, ...seedInstaxRows]) {
    const rel = row.profile_photo_path || row.image_path;
    if (!rel) continue;
    const full = join(uploadsDir, rel);
    if (existsSync(full)) {
      try {
        unlinkSync(full);
      } catch {
        // ignore file deletion errors for seed cleanup
      }
    }
  }

  const now = Date.now();
  const passwordHash = bcrypt.hashSync("test1234", 10);
  const insertUser = db.prepare(`
    INSERT INTO users (
      id, login, password_hash, short_name, bio, contact, profile_photo_path, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPost = db.prepare(`
    INSERT INTO posts (
      id, author_id, type, text_content, image_path, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 5; i++) {
    const n = i + 1;
    const userId = randomUUID();
    const color = buildColor(i);
    const profileRel = `profiles/seed-user${n}.webp`;
    const instaxRel = `instax/seed-user${n}-instax.webp`;

    await createImage(join(uploadsDir, profileRel), 640, 640, color);
    await createImage(join(uploadsDir, instaxRel), 1000, 750, color);

    const createdAt = now - (5 - n) * 60_000;

    insertUser.run(
      userId,
      `user${n}`,
      passwordHash,
      `Účastník ${n}`,
      `Bio uživatele ${n} pro demo feed.`,
      `kontakt-${n}@kyberbus.local`,
      profileRel,
      createdAt,
      createdAt
    );

    insertPost.run(
      randomUUID(),
      userId,
      "INSTAX",
      `Instax od uživatele ${n}`,
      instaxRel,
      createdAt + 1_000,
      createdAt + 1_000
    );

    insertPost.run(
      randomUUID(),
      userId,
      "LEPIK",
      `Lepík myšlenka uživatele ${n}.`,
      null,
      createdAt + 2_000,
      createdAt + 2_000
    );
  }

  db.close();

  console.log("Seed hotov.");
  console.log("Vytvořeno: 5 uživatelů, 5x Instax, 5x Lepík.");
  console.log("Loginy: user1..user5");
  console.log("Heslo pro všechny: test1234");
};

run().catch((error) => {
  console.error("Seed selhal:", error);
  process.exitCode = 1;
});
