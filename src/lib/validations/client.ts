import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === null || (typeof val === "string" && val.trim() === "")
    ? undefined
    : val;

export const clientSchema = z.object({
  isCompany: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.preprocess(emptyToUndefined, z.string().optional()),
  taxId: z.preprocess(emptyToUndefined, z.string().optional()),
  clientCode: z.preprocess(emptyToUndefined, z.string().optional()),
  birthDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  mobilePhone: z.preprocess(emptyToUndefined, z.string().optional()),
  landlinePhone: z.preprocess(emptyToUndefined, z.string().optional()),
  email: z.preprocess(
    emptyToUndefined,
    z.email("Email no válido").optional(),
  ),
  address: z.preprocess(emptyToUndefined, z.string().optional()),
  postalCode: z.preprocess(emptyToUndefined, z.string().optional()),
  city: z.preprocess(emptyToUndefined, z.string().optional()),
  province: z.preprocess(emptyToUndefined, z.string().optional()),
  region: z.preprocess(emptyToUndefined, z.string().optional()),
  country: z.preprocess(emptyToUndefined, z.string().optional()).default("ES"),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  whatsappOptIn: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  equivalenceSurcharge: z.preprocess(
    (v) => v === "on" || v === true,
    z.boolean(),
  ),
  tags: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const SPANISH_REGIONS = [
  "Andalucía",
  "Aragón",
  "Asturias",
  "Islas Baleares",
  "Canarias",
  "Cantabria",
  "Castilla-La Mancha",
  "Castilla y León",
  "Cataluña",
  "Extremadura",
  "Galicia",
  "La Rioja",
  "Comunidad de Madrid",
  "Región de Murcia",
  "Comunidad Foral de Navarra",
  "País Vasco",
  "Comunidad Valenciana",
  "Ceuta",
  "Melilla",
];
