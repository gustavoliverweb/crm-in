import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const catalogItemSchema = z.object({
  type: z.enum(["SERVICIO", "PRODUCTO", "EXTRA"]),
  name: z.string().min(1, "El nombre es obligatorio"),
  durationMinutes: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
  bufferMinutes: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
  basePrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
  vatRate: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(21),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  allowedTimes: z.preprocess(emptyToUndefined, z.string().optional()),
  maxPerSlot: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
  conditions: z.preprocess(emptyToUndefined, z.string().optional()),
  sku: z.preprocess(emptyToUndefined, z.string().optional()),
  stock: z.preprocess(emptyToUndefined, z.coerce.number().int().optional()),
});

export type CatalogItemFormValues = z.infer<typeof catalogItemSchema>;

export const CATALOG_TYPE_LABEL: Record<string, string> = {
  SERVICIO: "servicio",
  PRODUCTO: "producto",
  EXTRA: "extra",
};
