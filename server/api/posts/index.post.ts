import { createError, readMultipartFormData } from "h3";
import { randomUUID } from "node:crypto";
import { getDb, ensureSchema } from "~~/server/db/client";
import { posts } from "~~/server/db/schema";
import { requireUser } from "~~/server/utils/auth";
import { processAndStoreImage, validateImageInput } from "~~/server/utils/uploads";
import { createInstaxSchema, createLepikSchema } from "~~/server/utils/validation";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  ensureSchema();
  const db = getDb();
  const form = await readMultipartFormData(event);

  if (!form) {
    throw createError({ statusCode: 400, statusMessage: "Neplatný formulář příspěvku." });
  }

  const fields = Object.fromEntries(
    form
      .filter((item) => !item.filename)
      .map((item) => [item.name || "", item.data.toString("utf8")])
  );

  const type = String(fields.type || "");
  const ts = Date.now();
  const postId = randomUUID();

  if (type === "INSTAX") {
    const parsed = createInstaxSchema.safeParse({
      type,
      textContent: fields.textContent || ""
    });

    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: parsed.error.issues[0]?.message || "Neplatný Instax příspěvek."
      });
    }

    const imageFile = form.find((item) => item.name === "image" && item.filename);
    if (!imageFile?.data?.length) {
      throw createError({ statusCode: 400, statusMessage: "Instax vyžaduje fotku." });
    }

    validateImageInput({ mimeType: imageFile.type, fileName: imageFile.filename });

    const stored = await processAndStoreImage(imageFile.data, "instax", {
      mimeType: imageFile.type,
      fileName: imageFile.filename
    });

    await db.insert(posts).values({
      id: postId,
      authorId: user.id,
      type: "INSTAX",
      textContent: parsed.data.textContent,
      imagePath: stored.relativePath,
      createdAt: ts,
      updatedAt: ts
    });

    return { ok: true, id: postId };
  }

  if (type === "LEPIK") {
    const parsed = createLepikSchema.safeParse({
      type,
      textContent: fields.textContent || ""
    });

    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: parsed.error.issues[0]?.message || "Neplatný Lepík příspěvek."
      });
    }

    await db.insert(posts).values({
      id: postId,
      authorId: user.id,
      type: "LEPIK",
      textContent: parsed.data.textContent,
      imagePath: null,
      createdAt: ts,
      updatedAt: ts
    });

    return { ok: true, id: postId };
  }

  throw createError({ statusCode: 400, statusMessage: "Neznámý typ příspěvku." });
});
