import { createError, readMultipartFormData } from "h3";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { getDb, ensureSchema } from "~~/server/db/client";
import { users } from "~~/server/db/schema";
import { createSession } from "~~/server/utils/auth";
import { processAndStoreImage, validateImageInput } from "~~/server/utils/uploads";
import { registerPayloadSchema } from "~~/server/utils/validation";

export default defineEventHandler(async (event) => {
  ensureSchema();
  const db = getDb();
  const form = await readMultipartFormData(event);

  if (!form) {
    throw createError({ statusCode: 400, statusMessage: "Neplatný formulář." });
  }

  const fields = Object.fromEntries(
    form
      .filter((item) => !item.filename)
      .map((item) => [item.name || "", item.data.toString("utf8")])
  );

  const parsed = registerPayloadSchema.safeParse(fields);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Neplatná data registrace."
    });
  }

  const profileFile = form.find((item) => item.name === "profilePhoto" && item.filename);
  if (!profileFile?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: "Profilová fotka je povinná." });
  }

  validateImageInput({ mimeType: profileFile.type, fileName: profileFile.filename });

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.login, parsed.data.login))
    .limit(1);

  if (existing.length > 0) {
    throw createError({ statusCode: 409, statusMessage: "Toto přihlašovací jméno už existuje." });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const profilePhoto = await processAndStoreImage(profileFile.data, "profiles", {
    mimeType: profileFile.type,
    fileName: profileFile.filename
  });
  const ts = Date.now();
  const userId = randomUUID();
  const [anyExistingUser] = await db.select({ id: users.id }).from(users).limit(1);

  await db.insert(users).values({
    id: userId,
    login: parsed.data.login,
    passwordHash,
    role: anyExistingUser ? "USER" : "ADMIN",
    shortName: parsed.data.shortName,
    bio: parsed.data.bio,
    contact: parsed.data.contact,
    profilePhotoPath: profilePhoto.relativePath,
    createdAt: ts,
    updatedAt: ts
  });

  await createSession(event, userId);

  return { ok: true };
});
