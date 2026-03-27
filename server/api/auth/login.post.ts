import { createError, readBody } from "h3";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb, ensureSchema } from "~~/server/db/client";
import { users } from "~~/server/db/schema";
import { createSession } from "~~/server/utils/auth";
import { loginPayloadSchema } from "~~/server/utils/validation";

export default defineEventHandler(async (event) => {
  ensureSchema();
  const db = getDb();
  const body = await readBody(event);
  const parsed = loginPayloadSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Neplatná data přihlášení."
    });
  }

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash
    })
    .from(users)
    .where(eq(users.login, parsed.data.login))
    .limit(1);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Neplatné přihlášení." });
  }

  const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    throw createError({ statusCode: 401, statusMessage: "Neplatné přihlášení." });
  }

  await createSession(event, user.id);
  return { ok: true };
});
