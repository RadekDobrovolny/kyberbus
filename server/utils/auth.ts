import { and, eq, gt } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import type { H3Event } from "h3";
import { createError, deleteCookie, getCookie, setCookie } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { sessions, users } from "~~/server/db/schema";

const now = () => Date.now();

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const createSession = async (event: H3Event, userId: string) => {
  ensureSchema();
  const db = getDb();
  const runtime = useRuntimeConfig();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = now() + runtime.sessionMaxAgeSeconds * 1000;

  await db.insert(sessions).values({
    id: randomBytes(16).toString("hex"),
    tokenHash,
    userId,
    expiresAt,
    createdAt: now()
  });

  setCookie(event, runtime.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: runtime.sessionMaxAgeSeconds,
    path: "/"
  });
};

export const revokeSession = async (event: H3Event) => {
  ensureSchema();
  const db = getDb();
  const runtime = useRuntimeConfig();
  const token = getCookie(event, runtime.sessionCookieName);

  if (token) {
    const tokenHash = hashToken(token);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  deleteCookie(event, runtime.sessionCookieName, { path: "/" });
};

export const getCurrentUser = async (event: H3Event) => {
  ensureSchema();
  const db = getDb();
  const runtime = useRuntimeConfig();
  const token = getCookie(event, runtime.sessionCookieName);

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now())))
    .limit(1);

  if (!session) {
    deleteCookie(event, runtime.sessionCookieName, { path: "/" });
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      login: users.login,
      shortName: users.shortName,
      bio: users.bio,
      contact: users.contact,
      profilePhotoPath: users.profilePhotoPath,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return null;
  }

  return user;
};

export const requireUser = async (event: H3Event) => {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Nejprve se přihlas." });
  }
  return user;
};
