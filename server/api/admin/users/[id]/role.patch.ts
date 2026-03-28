import { eq } from "drizzle-orm";
import { createError, getRouterParam, readBody } from "h3";
import { getDb, ensureSchema } from "~~/server/db/client";
import { users } from "~~/server/db/schema";
import { requireAdmin } from "~~/server/utils/auth";
import { isUserRole } from "~~/shared/content";

export default defineEventHandler(async (event) => {
  const actor = await requireAdmin(event);
  ensureSchema();
  const db = getDb();
  const userId = getRouterParam(event, "id");

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "Chybí ID uživatele." });
  }

  const body = await readBody(event);
  if (!isUserRole(body?.role)) {
    throw createError({ statusCode: 400, statusMessage: "Neplatná role." });
  }
  const role = body.role;

  if (actor.id === userId && role !== "ADMIN") {
    throw createError({
      statusCode: 400,
      statusMessage: "Admin si nemůže odebrat vlastní práva."
    });
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: "Uživatel nebyl nalezen." });
  }

  await db
    .update(users)
    .set({
      role,
      updatedAt: Date.now()
    })
    .where(eq(users.id, userId));

  return { ok: true, role };
});
