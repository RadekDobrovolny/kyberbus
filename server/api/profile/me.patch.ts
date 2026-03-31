import { eq } from "drizzle-orm";
import { createError, readMultipartFormData } from "h3";
import { existsSync, unlinkSync } from "node:fs";
import bcrypt from "bcryptjs";
import { getDb, ensureSchema } from "~~/server/db/client";
import { users } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
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
  const form = await readMultipartFormData(event);

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

  const [existing] = await db
    .select({
      profilePhotoPath: users.profilePhotoPath
    })
    .from(users)
    .where(eq(users.id, authUser.id))
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

  const nextPasswordHash =
    parsedPassword.data && parsedPassword.data.length > 0
      ? await bcrypt.hash(parsedPassword.data, 10)
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
    .where(eq(users.id, authUser.id));

  return { ok: true };
});
