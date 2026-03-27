import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { createError } from "h3";

export type UploadedImage = {
  relativePath: string;
};

type SourceImageMeta = {
  mimeType?: string;
  fileName?: string;
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif"];

const resolveUploadsDir = () => {
  const runtime = useRuntimeConfig();
  return resolve(process.cwd(), runtime.uploadsDir);
};

const ensureUploadsDir = () => {
  const uploadsDir = resolveUploadsDir();
  mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
};

const isLikelyHeic = (meta?: SourceImageMeta) => {
  const mime = (meta?.mimeType || "").toLowerCase();
  const name = (meta?.fileName || "").toLowerCase();
  return (
    mime.includes("heic") ||
    mime.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
};

const require = createRequire(resolve(process.cwd(), "package.json"));
const heicConvert = require("heic-convert") as (params: {
  buffer: Buffer | Uint8Array;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<Buffer | Uint8Array>;

const convertHeicToJpeg = async (buffer: Buffer) => {
  const converted = await heicConvert({
    buffer,
    format: "JPEG",
    quality: 0.92
  });
  return Buffer.isBuffer(converted) ? converted : Buffer.from(converted);
};

export const validateImageInput = (meta?: SourceImageMeta) => {
  const mime = (meta?.mimeType || "").toLowerCase().trim();
  const fileName = (meta?.fileName || "").toLowerCase().trim();

  if (mime.startsWith("image/")) {
    return;
  }

  const isUnknownBinary =
    mime === "" || mime === "application/octet-stream" || mime === "binary/octet-stream";
  const hasImageExtension = IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (isUnknownBinary && hasImageExtension) {
    return;
  }

  throw createError({ statusCode: 400, statusMessage: "Nahraj obrázek." });
};

export const processAndStoreImage = async (
  buffer: Buffer,
  subdir: "profiles" | "instax",
  sourceMeta?: SourceImageMeta
): Promise<UploadedImage> => {
  const uploadsDir = ensureUploadsDir();
  const folder = join(uploadsDir, subdir);
  mkdirSync(folder, { recursive: true });

  const fileName = `${randomUUID()}.webp`;
  const absolutePath = join(folder, fileName);

  try {
    const inputBuffer = isLikelyHeic(sourceMeta)
      ? await convertHeicToJpeg(buffer)
      : buffer;

    await sharp(inputBuffer)
      .resize({ width: 1000, withoutEnlargement: true })
      .withMetadata()
      .webp({ quality: 82 })
      .toFile(absolutePath);
  } catch (error: any) {
    if (isLikelyHeic(sourceMeta)) {
      throw createError({
        statusCode: 415,
        statusMessage:
          "HEIC/HEIF fotku se nepodařilo převést. Zkus prosím jinou fotku nebo JPG/PNG."
      });
    }

    throw createError({
      statusCode: 400,
      statusMessage: "Nepodařilo se zpracovat obrázek. Zkus jiný formát (JPG, PNG, WEBP)."
    });
  }

  return { relativePath: `${subdir}/${fileName}` };
};

export const getAbsoluteUploadPath = (relativePath: string) => {
  const uploadsDir = ensureUploadsDir();
  return join(uploadsDir, relativePath);
};
