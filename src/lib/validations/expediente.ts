import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const expedienteSchema = z.object({
  clientId: z.preprocess(emptyToUndefined, z.string().optional()),
  name: z.string().min(1, "El nombre / referencia es obligatorio"),
  number: z.preprocess(emptyToUndefined, z.string().optional()),
  type: z.preprocess(emptyToUndefined, z.string().optional()),
  vatRegime: z.preprocess(emptyToUndefined, z.string().optional()),
  taxModels: z.preprocess(emptyToUndefined, z.string().optional()),
  periodicity: z.preprocess(emptyToUndefined, z.string().optional()),
  ownerTaxId: z.preprocess(emptyToUndefined, z.string().optional()),
  responsibleId: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z
    .preprocess(emptyToUndefined, z.enum(["ABIERTO", "EN_PROCESO", "CERRADO"]))
    .default("ABIERTO"),
  description: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type ExpedienteFormValues = z.infer<typeof expedienteSchema>;

export const EXPEDIENTE_TYPES = [
  "Autónomo",
  "Sociedad Limitada",
  "Sociedad Anónima",
  "Comunidad de Bienes",
  "Persona física",
  "Otro",
];

export const VAT_REGIMES = [
  "Régimen general",
  "Recargo de equivalencia",
  "Módulos (Estimación Objetiva)",
  "Régimen simplificado",
  "Exento",
];

export const PERIODICITIES = ["Mensual", "Trimestral", "Anual"];

export const EXPEDIENTE_STATUS_LABEL: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_PROCESO: "En proceso",
  CERRADO: "Cerrado",
};
