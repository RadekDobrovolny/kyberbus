import { desc } from "drizzle-orm";
import { getDb, ensureSchema } from "~~/server/db/client";
import { users } from "~~/server/db/schema";
import { requireAdmin } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  ensureSchema();
  const db = getDb();

  const rows = await db
    .select({
      id: users.id,
      login: users.login,
      role: users.role,
      shortName: users.shortName,
      bio: users.bio,
      contact: users.contact,
      profilePhotoPath: users.profilePhotoPath,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return { users: rows };
});
