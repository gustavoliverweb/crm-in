import { z } from "zod";
import { lineItemSchema } from "./line-item";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const invoiceSchema = z.object({
  clientId: z.preprocess(emptyToUndefined, z.string().optional()),
  type: z.preprocess(emptyToUndefined, z.enum(["SIMPLIFICADA", "COMPLETA"])).default("SIMPLIFICADA"),
  irpfRate: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
  dueDate: z.preprocess(emptyToUndefined, z.string().optional()),
  discountPct: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(100)).default(0),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["BORRADOR", "EMITIDA", "PAGADA", "VENCIDA"]),
  ).default("BORRADOR"),
});

export const invoiceLineSchema = lineItemSchema;

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  EMITIDA: "Emitida",
  PAGADA: "Pagada",
  VENCIDA: "Vencida",
};

export const INVOICE_TYPE_LABEL: Record<string, string> = {
  SIMPLIFICADA: "Simplificada",
  COMPLETA: "Completa",
};
