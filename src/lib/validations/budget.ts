import { z } from "zod";
import { lineItemSchema } from "./line-item";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const budgetSchema = z.object({
  clientId: z.preprocess(emptyToUndefined, z.string().optional()),
  validUntil: z.preprocess(emptyToUndefined, z.string().optional()),
  irpfRate: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
  salespersonId: z.preprocess(emptyToUndefined, z.string().optional()),
  paymentTerms: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  discountPct: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(100)).default(0),
  status: z
    .preprocess(emptyToUndefined, z.enum(["BORRADOR", "ENVIADO", "ACEPTADO", "RECHAZADO", "CADUCADO"]))
    .default("BORRADOR"),
});

export const budgetLineSchema = lineItemSchema;

export const BUDGET_STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADO: "Enviado",
  ACEPTADO: "Aceptado",
  RECHAZADO: "Rechazado",
  CADUCADO: "Caducado",
};
