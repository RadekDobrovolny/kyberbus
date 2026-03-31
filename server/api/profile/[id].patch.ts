import { asc, eq } from "drizzle-orm";
import { createError, getRouterParam, readMultipartFormData } from "h3";
import { existsSync, unlinkSync } from "node:fs";
import bcrypt from "bcryptjs";
import { getDb, ensureSchema } from "~~/server/db/client";
import { users } from "~~/server/db/schema";
import { isAdmin, requireUser } from "~~/server/utils/auth";
import {
  getAbsoluteUploadPath,
  processAndStoreImage,
  validateImageInput
} from "~~/server/utils/uploads";
import { editProfileSchema, passwordSchema } from "~~/server/utils/validation";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  ensureSchema();
  const db = getDb();
  const userId = getRouterParam(event, "id");
  const form = await readMultipartFormData(event);

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "Chybí ID profilu." });
  }

  if (!isAdmin(authUser) && authUser.id !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Tento profil nemůžeš upravit." });
  }

  if (!form) {
    throw createError({ statusCode: 400, statusMessage: "Neplatný formulář." });
  }

  const fields = Object.fromEntries(
    form
      .filter((item) => !item.filename)
      .map((item) => [item.name || "", item.data.toString("utf8")])
  );

  const parsed = editProfileSchema.safeParse(fields);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || "Neplatná data profilu."
    });
  }
  const parsedPassword = passwordSchema.optional().safeParse(fields.newPassword);
  if (!parsedPassword.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsedPassword.error.issues[0]?.message || "Neplatné nové heslo."
    });
  }
  const nextPassword = parsedPassword.data ?? "";
  const wantsPasswordChange = nextPassword.length > 0;

  const [firstUser] = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(asc(users.createdAt), asc(users.id))
    .limit(1);
  const isFirstUser = Boolean(firstUser && firstUser.id === userId);

  if (isFirstUser && authUser.id !== userId && wantsPasswordChange) {
    throw createError({
      statusCode: 403,
      statusMessage: "Prvnímu uživateli může heslo změnit jen jeho vlastník."
    });
  }

  const [existing] = await db
    .select({
      id: users.id,
      profilePhotoPath: users.profilePhotoPath
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Profil nebyl nalezen." });
  }

  let nextPhotoPath = existing.profilePhotoPath;
  const photoFile = form.find((item) => item.name === "profilePhoto" && item.filename);

  if (photoFile?.data?.length) {
    validateImageInput({ mimeType: photoFile.type, fileName: photoFile.filename });

    const uploaded = await processAndStoreImage(photoFile.data, "profiles", {
      mimeType: photoFile.type,
      fileName: photoFile.filename
    });
    nextPhotoPath = uploaded.relativePath;

    if (existing.profilePhotoPath) {
      const absoluteOld = getAbsoluteUploadPath(existing.profilePhotoPath);
      if (existsSync(absoluteOld)) {
        unlinkSync(absoluteOld);
      }
    }
  }

  const nextPasswordHash = wantsPasswordChange
    ? await bcrypt.hash(nextPassword, 10)
    : undefined;

  await db
    .update(users)
    .set({
      shortName: parsed.data.shortName,
      bio: parsed.data.bio,
      contact: parsed.data.contact,
      profilePhotoPath: nextPhotoPath,
      ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
      updatedAt: Date.now()
    })
    .where(eq(users.id, userId));

  return { ok: true };
});
