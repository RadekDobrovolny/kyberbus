import { z } from "zod";

export const text250Schema = z
  .string()
  .trim()
  .min(1, "Pole je povinné")
  .max(250, "Maximum je 250 znaků");

export const loginSchema = z
  .string()
  .trim()
  .min(3, "Minimálně 3 znaky")
  .max(50, "Maximum je 50 znaků")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Povolená písmena: a-z, 0-9, _, ., -");

export const passwordSchema = z
  .string()
  .min(6, "Heslo musí mít minimálně 6 znaků")
  .max(100, "Heslo je příliš dlouhé");

export const registerPayloadSchema = z.object({
  login: loginSchema,
  password: passwordSchema,
  shortName: text250Schema,
  bio: text250Schema,
  contact: text250Schema
});

export const loginPayloadSchema = z.object({
  login: loginSchema,
  password: passwordSchema
});

export const editProfileSchema = z.object({
  shortName: text250Schema,
  bio: text250Schema,
  contact: text250Schema
});

export const createPostBaseSchema = z.object({
  type: z.enum(["INSTAX", "LEPIK", "DISPECINK", "KDO", "MESTO"]),
  textContent: z.string().trim()
});

export const createInstaxSchema = createPostBaseSchema.extend({
  type: z.literal("INSTAX"),
  textContent: z.string().trim().max(50, "Instax text může mít max 50 znaků")
});

export const createLepikSchema = createPostBaseSchema.extend({
  type: z.literal("LEPIK"),
  textContent: z.string().trim().max(200, "Lepík může mít max 200 znaků")
});

export const createDispecinkSchema = createPostBaseSchema.extend({
  type: z.literal("DISPECINK"),
  textContent: z.string().trim().max(500, "Oznámení může mít max 500 znaků"),
  noticeLevel: z.enum(["INFO", "IMPORTANT"]).optional().default("INFO")
});

export const createMestoSchema = createPostBaseSchema.extend({
  type: z.literal("MESTO"),
  textContent: z.string().trim().max(100, "Město může mít max 100 znaků")
});

export const createKdoSchema = createPostBaseSchema.extend({
  type: z.literal("KDO"),
  textContent: z.string().trim().max(150, "Otázka může mít max 150 znaků")
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : 30))
    .pipe(z.number().int().min(1).max(50))
});
