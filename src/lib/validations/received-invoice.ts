import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const receivedInvoiceSchema = z.object({
  providerId: z.preprocess(emptyToUndefined, z.string().optional()),
  invoiceNumber: z.preprocess(emptyToUndefined, z.string().optional()),
  invoiceDate: z.preprocess(emptyToUndefined, z.string().optional()),
  baseAmount: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
  vatAmount: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
  totalAmount: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["PENDIENTE_VERIFICACION", "VERIFICADA"]),
  ).default("PENDIENTE_VERIFICACION"),
});

export const receivedInvoiceLineSchema = z.object({
  productName: z.string().min(1, "El producto es obligatorio"),
  sku: z.preprocess(emptyToUndefined, z.string().optional()),
  quantity: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(1),
  unit: z.preprocess(emptyToUndefined, z.string().optional()),
  unitPrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
  total: z.preprocess(emptyToUndefined, z.coerce.number().min(0)).default(0),
});

export const RECEIVED_INVOICE_STATUS_LABEL: Record<string, string> = {
  PENDIENTE_VERIFICACION: "Pendiente de verificación",
  VERIFICADA: "Verificada",
};
