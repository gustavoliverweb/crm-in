import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const lineItemSchema = z.object({
  catalogItemId: z.preprocess(emptyToUndefined, z.string().optional()),
  description: z.string().min(1, "La descripción de la línea es obligatoria"),
  quantity: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(1),
  unitPrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
  discountPct: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(100)).default(0),
  vatRate: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(21),
});
