import { and, eq, gt } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import type { H3Event } from "h3";
import { createError, deleteCookie, getCookie, setCookie } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { sessions, users } from "~~/server/db/schema";
import { normalizeUserRole } from "~~/shared/content";

const now = () => Date.now();
const LAST_ACTIVE_TOUCH_INTERVAL_MS = 60_000;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const resolveSessionCookieSecure = (event: H3Event, runtime: ReturnType<typeof useRuntimeConfig>) => {
  const raw = String(runtime.sessionCookieSecure || "auto").toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") {
    return true;
  }
  if (raw === "false" || raw === "0" || raw === "no") {
    return false;
  }

  const header = event.node.req.headers["x-forwarded-proto"];
  const forwardedProto = Array.isArray(header) ? header[0] : header;
  if (typeof forwardedProto === "string") {
    const first = forwardedProto.split(",")[0]?.trim().toLowerCase();
    if (first === "https") {
      return true;
    }
    if (first === "http") {
      return false;
    }
  }

  return Boolean((event.node.req.socket as { encrypted?: boolean }).encrypted);
};

export const createSession = async (event: H3Event, userId: string) => {
  ensureSchema();
  const db = getDb();
  const runtime = useRuntimeConfig();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const ts = now();
  const expiresAt = ts + runtime.sessionMaxAgeSeconds * 1000;

  await db.insert(sessions).values({
    id: randomBytes(16).toString("hex"),
    tokenHash,
    userId,
    expiresAt,
    createdAt: ts
  });
  await db
    .update(users)
    .set({ lastActiveAt: ts })
    .where(eq(users.id, userId));

  setCookie(event, runtime.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: resolveSessionCookieSecure(event, runtime),
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
      role: users.role,
      shortName: users.shortName,
      bio: users.bio,
      contact: users.contact,
      profilePhotoPath: users.profilePhotoPath,
      createdAt: users.createdAt,
      lastActiveAt: users.lastActiveAt
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return null;
  }

  const ts = now();
  const shouldTouchLastActive =
    !user.lastActiveAt || ts - user.lastActiveAt >= LAST_ACTIVE_TOUCH_INTERVAL_MS;
  if (shouldTouchLastActive) {
    await db
      .update(users)
      .set({ lastActiveAt: ts })
      .where(eq(users.id, user.id));
    user.lastActiveAt = ts;
  }

  return user;
};

export const isAdmin = (user: { role?: string | null }) =>
  normalizeUserRole(user.role) === "ADMIN";

export const requireUser = async (event: H3Event) => {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Nejprve se přihlas." });
  }
  return user;
};

export const requireAdmin = async (event: H3Event) => {
  const user = await requireUser(event);
  if (!isAdmin(user)) {
    throw createError({ statusCode: 403, statusMessage: "Tato akce je pouze pro admina." });
  }
  return user;
};
